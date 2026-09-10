import type { Perfume, SiteSettings, StorefrontContent } from "./types";
import { PERFUMES } from "./perfumes";
import { SITE_SETTINGS } from "./settings";

/**
 * The one seam between the storefront and its content source.
 *
 * Today every method resolves from in-memory mock data. In a later phase the
 * same interface is backed by a database or headless CMS and populated from the
 * Admin Panel — no storefront component needs to change, because none of them
 * import the mock arrays directly.
 *
 * Methods are async on purpose so callers are already written for a real
 * data source.
 */
export interface ContentRepository {
  getSettings(): Promise<SiteSettings>;
  getPerfumes(): Promise<Perfume[]>;
  getFeaturedPerfumes(): Promise<Perfume[]>;
  getPerfumeBySlug(slug: string): Promise<Perfume | null>;
  getAllPerfumeSlugs(): Promise<string[]>;
  getContent(): Promise<StorefrontContent>;
}

const byOrder = (a: Perfume, b: Perfume) => a.order - b.order;

class MockContentRepository implements ContentRepository {
  async getSettings(): Promise<SiteSettings> {
    return SITE_SETTINGS;
  }

  async getPerfumes(): Promise<Perfume[]> {
    return [...PERFUMES].sort(byOrder);
  }

  async getFeaturedPerfumes(): Promise<Perfume[]> {
    return [...PERFUMES].filter((p) => p.featured).sort(byOrder);
  }

  async getPerfumeBySlug(slug: string): Promise<Perfume | null> {
    return PERFUMES.find((p) => p.slug === slug) ?? null;
  }

  async getAllPerfumeSlugs(): Promise<string[]> {
    return PERFUMES.map((p) => p.slug);
  }

  async getContent(): Promise<StorefrontContent> {
    const [settings, perfumes] = await Promise.all([
      this.getSettings(),
      this.getPerfumes(),
    ]);
    return { settings, perfumes };
  }
}

/**
 * Swap this single assignment in a later phase to change the whole site's
 * data source.
 */
export const contentRepository: ContentRepository = new MockContentRepository();
