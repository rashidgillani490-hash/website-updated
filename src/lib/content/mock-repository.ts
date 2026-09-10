import type {
  ContentRepository,
  Perfume,
  SiteSettings,
  StorefrontContent,
} from "./types";
import { PERFUMES } from "./perfumes";
import { SITE_SETTINGS } from "./settings";

const byOrder = (a: Perfume, b: Perfume) => a.order - b.order;

/**
 * In-memory implementation over the sample catalogue in `perfumes.ts` /
 * `settings.ts`. Used for local development, tests, preview, and as the
 * fallback whenever Supabase is not configured. Behaves like the production
 * repository: async, sorted by display order, `null` for a missing slug.
 */
export class MockContentRepository implements ContentRepository {
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
    return [...PERFUMES].sort(byOrder).map((p) => p.slug);
  }

  async getContent(): Promise<StorefrontContent> {
    const [settings, perfumes] = await Promise.all([
      this.getSettings(),
      this.getPerfumes(),
    ]);
    return { settings, perfumes };
  }
}
