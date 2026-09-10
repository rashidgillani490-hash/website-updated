import type { SiteSettings } from "./types";

/**
 * Default site settings. In a later phase these become editable in the Admin
 * Panel (Site Settings); for now they are the single source of truth for
 * brand copy, navigation and contact details.
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
  // Editable homepage copy — mirrors the DB model. The Hero still takes literal
  // props today, so these are carried but not yet read by any component.
  heroHeadline: "The scent of a room at dusk",
  heroIntro:
    "Maison Lumière is a small Parisian house making auteur perfumes — each one signed, made in limited batches, and left exactly as it was composed.",
  homepageIntro:
    "A small house, run deliberately slowly. One accord at a time, signed by the nose, made in small batches, kept as it was.",
  brandStory:
    "Maison Lumière is a small Parisian perfume house. Each composition is signed by its perfumer and made in limited batches, without reformulation.",
};
