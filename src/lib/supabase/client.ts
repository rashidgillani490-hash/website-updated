import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both public Supabase env vars are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/** Hostname of the configured project, for `next.config` image allow-listing. */
export function supabaseHostname(): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

let cached: SupabaseClient | null = null;

/**
 * Anon (public) Supabase client. Safe on the server or the client — every
 * query is still subject to Row Level Security, which only exposes published
 * content. Returns `null` when Supabase is not configured, which is the signal
 * for the content layer to fall back to MockContentRepository.
 */
export function getPublicSupabaseClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!cached) {
    cached = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
