import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

// Tiny and rarely hit — render per request so it always reflects the current
// SITE_URL without needing a rebuild.
export const dynamic = "force-dynamic";

/**
 * Allow crawling of the storefront; keep bots out of the bag, checkout and the
 * admin panel (all also `noindex`). The sitemap URL and host resolve from the
 * runtime SITE_URL env var — localhost until the real domain is configured.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/cart", "/checkout"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
