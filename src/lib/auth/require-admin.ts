import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AdminSession {
  supabase: SupabaseClient;
  user: User;
}

/**
 * Server-side check for `is this request from a signed-in administrator?`.
 * `null` for anonymous, a not-configured backend, or an authenticated user who
 * is not on the `public.admins` allow-list. Uses the SECURITY DEFINER
 * `is_admin()` RPC, so authorization is enforced by the database, not just here.
 *
 * `cache()`d so the protected layout and the page it renders share one check
 * (and one Supabase client) per request.
 */
export const getAdminSession = cache(
  async (): Promise<AdminSession | null> => {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: isAdmin, error } = await supabase.rpc("is_admin");
    if (error || isAdmin !== true) return null;

    return { supabase, user };
  },
);

/**
 * As above, but redirects to the login page instead of returning `null`. Use in
 * the protected admin layout and at the top of every admin Server Action — an
 * action must never trust that the route guard already ran.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
