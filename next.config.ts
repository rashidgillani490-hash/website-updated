import type { NextConfig } from "next";

// Allow next/image to optimise files served from the configured Supabase
// Storage bucket, once perfume photography is uploaded there. Scoped to the
// public object path of this one project; a no-op until Supabase is configured.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL as string).hostname;
      } catch {
        return null;
      }
    })()
  : null;

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
};

export default nextConfig;
