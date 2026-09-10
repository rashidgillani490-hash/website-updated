"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

/**
 * Password sign-in for `useActionState`. On success it also confirms the user
 * is on the admin allow-list (a valid Supabase account is not enough) and, if
 * not, signs them straight back out. All failures return one plain sentence —
 * the underlying auth/database error is never shown.
 */
export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { error: "The admin area is not configured on this deployment." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Those details don't match an administrator account." };
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: "That account doesn't have admin access." };
  }

  redirect("/admin");
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}
