import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security. SERVER ONLY.
 *
 * Not used anywhere yet. It exists so the Admin phase (authenticated content
 * writes) has a single, correct entry point. `import "server-only"` makes any
 * accidental client-side import a build error; the key is read from a
 * non-`NEXT_PUBLIC_` env var so it is never inlined into browser bundles.
 */
export function getServiceSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service-role client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
