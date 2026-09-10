import type { SiteSettings } from "./types";

/**
 * Default site settings. Editable in the Admin Panel (Site Settings) once
 * Supabase is configured; otherwise this object is the single source of truth
 * for brand copy, navigation and contact details. Every field here is consumed
 * by the storefront — see `SiteSettings` in `types.ts` for where.
 */
export const SITE_SETTINGS: SiteSettings = {
  brandName: "Maison Lumière",
  tagline: "Parfums d'Auteur — Paris",
  description:
    "Maison Lumière is a small Parisian perfume house. Each composition is signed by its perfumer and made in limited batches, without reformulation.",
  announcement: "Complimentary engraving and shipping on orders over $200",
  // Only routes/anchors that resolve today. Journal, Shipping and Ingredients
  // return as real pages in a later phase, at which point their links come back.
  primaryNav: [
    { label: "Collection", href: "/collection" },
    { label: "The House", href: "/#house" },
    { label: "Notes", href: "/#notes" },
  ],
  footerNav: [
    { label: "Collection", href: "/collection" },
    { label: "Contact", href: "/#contact" },
    { label: "Admin", href: "/admin" },
  ],
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Pinterest", href: "https://pinterest.com" },
  ],
  contactEmail: "atelier@maisonlumiere.example",
  addressLines: ["9 Rue de Sévigné", "75004 Paris", "France"],
  currency: "USD",
  // Editable homepage copy. The home page reads these directly:
  // heroHeadline / heroIntro feed the Hero, homepageIntro the house section,
  // brandStory the featured-collection lead-in. `\n` in the headline is a line break.
  heroHeadline: "The scent of\na room at dusk",
  heroIntro:
    "Maison Lumière is a small Parisian house making auteur perfumes — each one signed, made in limited batches, and left exactly as it was composed.",
  homepageIntro:
    "A small house, run deliberately slowly. One accord at a time, signed by the nose, made in small batches, kept as it was.",
  brandStory:
    "Maison Lumière is a small Parisian perfume house. Each composition is signed by its perfumer and made in limited batches, without reformulation.",
};
