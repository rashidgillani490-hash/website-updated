/**
 * Canonical site origin, resolved from the environment. Used only by
 * server-side metadata / `sitemap.ts` / `robots.ts`.
 *
 * Precedence:
 *   1. SITE_URL              — runtime env var, no rebuild needed on change
 *   2. NEXT_PUBLIC_SITE_URL  — build-time equivalent (convention)
 *   3. VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL — automatic on Vercel
 *   4. http://localhost:3000 — local / not-yet-configured fallback
 *
 * Nothing hardcodes the final domain: until an env var is set, metadata,
 * canonical links and the sitemap all point at localhost, which is harmless and
 * flips to the real values the moment the domain is configured.
 */

const LOCAL_FALLBACK = "http://localhost:3000";

function normalise(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const explicit =
    process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
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
