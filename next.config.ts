import type { NextConfig } from "next";
import {
  buildCsp,
  commonSecurityHeaders,
  supabaseHostFromEnv,
} from "./src/lib/security-headers";

const supabaseHost = supabaseHostFromEnv();
const isProd = process.env.NODE_ENV === "production";

/**
 * Security headers.
 *
 * - Every route gets `commonSecurityHeaders` (nosniff, X-Frame-Options, HSTS…).
 * - Every route EXCEPT `/admin/*` gets the compatible CSP here (static + ISR
 *   pages can't carry a per-request nonce — see `buildCsp`).
 * - `/admin/*` is always dynamically rendered and behind middleware, so its CSP
 *   is issued per request with a nonce in `src/lib/supabase/middleware.ts`
 *   (production) — a strict `script-src 'nonce-…' 'strict-dynamic'` with no
 *   `'unsafe-inline'`.
 *
 * The separate, stricter CSP under `images.contentSecurityPolicy` applies to the
 * optimiser's own SVG responses and is unrelated to this one.
 */
const nextConfig: NextConfig = {
  images: {
    // The placeholder art in /public is SVG. Allow the optimizer to serve it,
    // sandboxed and with a CSP so it cannot execute script.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/:path*", headers: commonSecurityHeaders(isProd) },
      {
        // CSP for everything except the /admin tree (middleware owns that one).
        source: "/((?!admin(?:$|/)).*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildCsp({ isProd, supabaseHost }),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
