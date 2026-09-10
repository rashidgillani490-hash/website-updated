import type { NextConfig } from "next";

// Hostname of the configured Supabase project, if any. Used both to allow
// next/image to optimise Storage photos and to widen the CSP just enough for
// the browser Supabase client to reach its own project.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL as string).hostname;
      } catch {
        return null;
      }
    })()
  : null;

const isProd = process.env.NODE_ENV === "production";

/**
 * App-wide Content-Security-Policy.
 *
 * - `script-src` allows inline scripts because Next's App Router streams inline
 *   bootstrap/RSC `<script>` tags that are not hashed or nonced. `'unsafe-eval'`
 *   is added in development only (React Refresh / HMR need it); production runs
 *   without it — three.js / R3F / drei / motion / zod / supabase-js do not eval.
 * - `style-src` allows inline styles: motion and many components set `style={}`.
 * - `img-src` covers the next/image optimiser (`'self'`), blur/data URIs, admin
 *   upload previews (`blob:`) and public Storage objects on the Supabase host.
 * - `connect-src` lets the browser Supabase client talk to its own project
 *   (REST + realtime websocket); `ws:` is dev-only for HMR.
 * - `frame-ancestors 'none'` + `X-Frame-Options` block clickjacking of the
 *   storefront and, crucially, the admin panel.
 *
 * The separate, stricter CSP under `images.contentSecurityPolicy` applies to the
 * optimiser's own SVG responses and is unrelated to this one.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
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

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
