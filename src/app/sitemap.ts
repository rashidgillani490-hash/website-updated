import type { MetadataRoute } from "next";
import { contentRepository } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

// Render per request: keeps URLs in step with the current SITE_URL and the
// live catalogue without waiting on a rebuild or a revalidation window.
export const dynamic = "force-dynamic";

/**
 * Public, indexable pages only — the home page, the collection, and every
 * published fragrance. Cart / checkout / admin are intentionally excluded (they
 * are `noindex` and disallowed in robots).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const perfumes = await contentRepository.getPerfumes();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: absoluteUrl("/collection"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const perfumeRoutes: MetadataRoute.Sitemap = perfumes.map((perfume) => ({
    url: absoluteUrl(`/fragrance/${perfume.slug}`),
    lastModified: perfume.updatedAt ? new Date(perfume.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...perfumeRoutes];
}
