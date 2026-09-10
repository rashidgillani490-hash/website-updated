/**
 * Content model for Maison Lumière.
 *
 * Every shape here is what the Admin Panel will eventually create and edit.
 * The storefront only ever reads through the ContentRepository, so swapping
 * the mock source for a database or CMS in a later phase touches one file.
 */

export type FragranceFamily =
  | "Floral"
  | "Woody"
  | "Amber"
  | "Chypre"
  | "Citrus"
  | "Leather"
  | "Aromatic";

export type NoteTier = "top" | "heart" | "base";

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
}

export interface StorefrontContent {
  settings: SiteSettings;
  perfumes: Perfume[];
}
