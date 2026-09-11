/**
 * Canonical site origin, resolved from the environment. Read only on the server
 * — by root/route `generateMetadata`, `sitemap.ts` and `robots.ts`.
 *
 * Precedence:
 *   1. SITE_URL — plain (NOT `NEXT_PUBLIC_`) runtime env var. Read on every
 *      server render: `robots` / `sitemap` are `force-dynamic` so they pick it
 *      up per request; the marketing pages carry it through ISR and refresh it
 *      within their revalidate window. Changing the domain needs a redeploy or
 *      one revalidation cycle — never a code rebuild.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — stable production domain, injected by
 *      Vercel at build and runtime in every environment (correct for canonical
 *      even on preview deployments).
 *   3. VERCEL_URL — per-deployment host; last resort before localhost.
 *   4. http://localhost:3000 — local / not-yet-configured fallback.
 *
 * Deliberately no `NEXT_PUBLIC_SITE_URL`: this value is never needed in the
 * browser, and the public variant would be inlined into the client bundle at
 * build time — the exact "baked in" behaviour we want to avoid. Nothing
 * hardcodes the final domain: until `SITE_URL` (or a Vercel var) is set,
 * metadata, canonical links and the sitemap point at localhost, which is
 * harmless and flips to the real values the moment the domain is configured.
 */

const LOCAL_FALLBACK = "http://localhost:3000";

function normalise(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return normalise(explicit);

  const vercel = (
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  )?.trim();
  if (vercel) return normalise(vercel);

  return LOCAL_FALLBACK;
}

/** True once a real domain has been configured (not the localhost fallback). */
export function isSiteUrlConfigured(): boolean {
  return getSiteUrl() !== LOCAL_FALLBACK;
}

/** Absolute URL for a site-relative path, e.g. absoluteUrl("/collection"). */
export function absoluteUrl(path = "/"): string {
  return new URL(path, getSiteUrl()).toString();
}

/**
 * The `openGraph` fields every page shares. Next replaces (does not deep-merge)
 * `openGraph` when a page redefines it, so each page spreads this in rather than
 * relying on the root layout's block surviving.
 */
export function baseOpenGraph(siteName: string) {
  return { type: "website" as const, siteName, locale: "en_US" };
}
