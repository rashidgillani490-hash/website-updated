/**
 * Security-header construction, shared by `next.config.ts` (static, all routes)
 * and `src/lib/supabase/middleware.ts` (per-request nonce CSP, `/admin` only).
 *
 * Pure — no imports, no Node/Edge APIs — so it is safe in the config loader and
 * the Edge middleware runtime alike.
 */

/** Hostname of the configured Supabase project, or null. */
export function supabaseHostFromEnv(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export interface CspOptions {
  /** When set, `script-src` becomes `'nonce-<x>' 'strict-dynamic'` (no
   *  `'unsafe-inline'`, no `'self'` host list). Only for dynamically-rendered
   *  responses. */
  nonce?: string;
  isProd: boolean;
  supabaseHost: string | null;
}

/**
 * The Content-Security-Policy value.
 *
 * Without a nonce (the static storefront): `script-src 'self' 'unsafe-inline'`
 * — Next streams un-nonced inline bootstrap/RSC `<script>` tags on prerendered
 * pages and those can't be hashed at config time. Production still omits
 * `'unsafe-eval'` and keeps everything else tight; no user-supplied HTML is
 * rendered anywhere.
 *
 * With a nonce (the always-dynamic `/admin` tree): the strict form — only
 * scripts carrying this request's nonce, and scripts they load, may run.
 */
export function buildCsp({ nonce, isProd, supabaseHost }: CspOptions): string {
  const scriptSrc = nonce
    ? `script-src 'nonce-${nonce}' 'strict-dynamic'${isProd ? "" : " 'unsafe-eval'"}`
    : `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`;

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "form-action 'self'",
    scriptSrc,
    // `next/font` injects an inline <style>, and components set style={}
    // attributes — neither is nonceable across browsers.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${supabaseHost ? ` https://${supabaseHost}` : ""}`,
    "font-src 'self'",
    `connect-src 'self'${
      supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : ""
    }${isProd ? "" : " ws:"}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

/** The headers that are the same on every route (CSP is handled separately). */
export function commonSecurityHeaders(isProd: boolean): { key: string; value: string }[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ...(isProd
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ]
      : []),
  ];
}
