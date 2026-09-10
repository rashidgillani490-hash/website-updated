/**
 * Content model for Maison Lumière.
 *
 * These are the shapes the storefront renders and the Admin Panel will edit.
 * The storefront only ever reads them through a `ContentRepository`, so the
 * data source (in-memory mock, Supabase, a CMS) is a one-line swap and no
 * component changes. Fields added for the database model are optional so the
 * existing component APIs keep compiling unchanged.
 */

export type FragranceFamily =
  | "Floral"
  | "Woody"
  | "Amber"
  | "Chypre"
  | "Citrus"
  | "Leather"
  | "Aromatic";

export const FRAGRANCE_FAMILIES: readonly FragranceFamily[] = [
  "Floral",
  "Woody",
  "Amber",
  "Chypre",
  "Citrus",
  "Leather",
  "Aromatic",
];

export type NoteTier = "top" | "heart" | "base";

/** Purchase state. Stored in the DB; not yet surfaced in the storefront UI. */
export type PerfumeAvailability =
  | "available"
  | "coming-soon"
  | "sold-out"
  | "archived";

export interface FragranceNote {
  name: string;
  tier: NoteTier;
  /** One-line evocation shown on the detail page. */
  description?: string;
}

export interface PerfumeImage {
  src: string;
  alt: string;
}

export interface PerfumeSize {
  /** Millilitres. */
  ml: number;
  /** Price in the store's base currency, minor units excluded. */
  price: number;
}

export interface Perfume {
  id: string;
  slug: string;
  name: string;
  /** Short poetic subtitle, e.g. "Eau de Parfum". */
  concentration: string;
  family: FragranceFamily;
  /** Single sentence used in cards and meta descriptions. */
  tagline: string;
  /** Long-form story, rendered as paragraphs (split on blank lines). */
  description: string;
  /** The nose behind the composition. */
  perfumer: string;
  year: number;
  notes: FragranceNote[];
  sizes: PerfumeSize[];
  hero: PerfumeImage;
  gallery: PerfumeImage[];
  /** Dominant hue used by the 3D scene and card accents. Hex. */
  accent: string;
  featured: boolean;
  /** Sort weight for the collection grid; lower shows first. */
  order: number;
  /** DB-backed sources only. Defaults to "available" when absent. */
  availability?: PerfumeAvailability;
  /** Whether the storefront may show it. The public repository only ever
   *  returns published records (RLS), so this is `true` there; the admin
   *  repository sets it from the row so drafts can be managed. */
  isPublished?: boolean;
  /** ISO timestamp of the last edit. DB-backed sources only. */
  updatedAt?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteSettings {
  brandName: string;
  /** Sits under the wordmark in the header and footer. */
  tagline: string;
  /** Short paragraph for the footer and about blocks. */
  description: string;
  announcement: string;
  primaryNav: NavLink[];
  footerNav: NavLink[];
  social: NavLink[];
  contactEmail: string;
  addressLines: string[];
  /** Base ISO currency code, e.g. "USD". */
  currency: string;
  /** Brand marks — Storage paths/URLs. Not yet surfaced in the UI. */
  logoUrl?: string;
  faviconUrl?: string;
  /** Editable homepage copy. Mirrors the DB model; the Hero still takes
   *  literal props today, so these are not read yet. */
  heroHeadline?: string;
  heroIntro?: string;
  homepageIntro?: string;
  brandStory?: string;
  /** ISO timestamp of the last edit. DB-backed sources only. */
  updatedAt?: string;
}

export interface StorefrontContent {
  settings: SiteSettings;
  perfumes: Perfume[];
}

/**
 * The single seam between the storefront and its content source. Every method
 * is async so callers are already written for a real backend. Implementations:
 * `MockContentRepository` (sample data — dev, tests, preview, fallback) and
 * `SupabaseContentRepository` (production).
 */
export interface ContentRepository {
  getSettings(): Promise<SiteSettings>;
  getPerfumes(): Promise<Perfume[]>;
  getFeaturedPerfumes(): Promise<Perfume[]>;
  getPerfumeBySlug(slug: string): Promise<Perfume | null>;
  getAllPerfumeSlugs(): Promise<string[]>;
  getContent(): Promise<StorefrontContent>;
}
