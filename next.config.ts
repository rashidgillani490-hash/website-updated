import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The placeholder art in /public is SVG. Allow the optimizer to serve it,
    // sandboxed and with a CSP so it cannot execute script.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
