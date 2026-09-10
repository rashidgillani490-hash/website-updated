import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Request-scoped Supabase client that carries the signed-in user's session
 * (read from cookies). Use it in Server Components, Route Handlers and Server
 * Actions when you need the *current user* — auth, and RLS-gated admin
 * reads/writes. Every query still runs under Row Level Security.
 *
 * Returns `null` when Supabase is not configured, so the public site keeps
 * working on mock data and the admin area can show a clear "not configured"
 * message instead of crashing.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component, where the cookie store is
          // read-only. The middleware refreshes the session cookie instead.
        }
      },
    },
  });
}
