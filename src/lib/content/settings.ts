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
  primaryNav: [
    { label: "Collection", href: "/collection" },
    { label: "The House", href: "/#house" },
    { label: "Notes", href: "/#notes" },
    { label: "Journal", href: "/#journal" },
  ],
  footerNav: [
    { label: "Collection", href: "/collection" },
    { label: "Shipping & Returns", href: "/#shipping" },
    { label: "Ingredients", href: "/#ingredients" },
    { label: "Contact", href: "/#contact" },
    { label: "Admin", href: "/admin" },
  ],
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Pinterest", href: "https://pinterest.com" },
    { label: "Journal", href: "/#journal" },
  ],
  contactEmail: "atelier@maisonlumiere.example",
  addressLines: ["9 Rue de Sévigné", "75004 Paris", "France"],
  currency: "USD",
};
