/**
 * Supabase row shapes and the mapping from them to the domain model in
 * `types.ts`. Keeping the wire format here means `SupabaseContentRepository`
 * never leaks snake_case, JSON blobs, or `null`s into the rest of the app, and
 * the storefront / 3D components keep receiving plain `Perfume` / `SiteSettings`
 * with no knowledge of the database.
 */

import {
  FRAGRANCE_FAMILIES,
  type FragranceFamily,
  type NavLink,
  type NoteTier,
  type Perfume,
  type PerfumeAvailability,
  type PerfumeImage,
  type PerfumeSize,
  type SiteSettings,
} from "./types";
import { SITE_SETTINGS } from "./settings";

const STORAGE_BUCKET = "perfume-images";
const NOTE_TIERS: readonly NoteTier[] = ["top", "heart", "base"];
const AVAILABILITY: readonly PerfumeAvailability[] = [
  "available",
  "coming-soon",
  "sold-out",
  "archived",
];

/* ---------------------------------------------------------------- row types */

export interface SettingsRow {
  brand_name: string | null;
  tagline: string | null;
  description: string | null;
  announcement: string | null;
  primary_nav: unknown;
  footer_nav: unknown;
  social: unknown;
  contact_email: string | null;
  address_lines: string[] | null;
  currency: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  hero_headline: string | null;
  hero_intro: string | null;
  homepage_intro: string | null;
  brand_story: string | null;
  updated_at: string | null;
}

export interface SizeRow {
  ml: number | null;
  price: number | string | null;
  display_order: number | null;
}

export interface NoteRow {
  name: string | null;
  tier: string | null;
  description: string | null;
  display_order: number | null;
}

export interface ImageRow {
  role: string | null;
  path: string | null;
  alt: string | null;
  display_order: number | null;
}

export interface PerfumeRow {
  id: string | null;
  slug: string | null;
  name: string | null;
  concentration: string | null;
  family: string | null;
  tagline: string | null;
  description: string | null;
  perfumer: string | null;
  year: number | null;
  accent: string | null;
  featured: boolean | null;
  availability: string | null;
  display_order: number | null;
  is_published: boolean | null;
  updated_at: string | null;
  perfume_sizes: SizeRow[] | null;
  fragrance_notes: NoteRow[] | null;
  perfume_images: ImageRow[] | null;
}

/* ------------------------------------------------------------------ helpers */

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function byDisplayOrder<T extends { display_order: number | null }>(
  a: T,
  b: T,
): number {
  return num(a.display_order) - num(b.display_order);
}

function toNavLinks(value: unknown): NavLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { label: unknown; href: unknown } =>
        !!item && typeof item === "object",
    )
    .map((item) => ({ label: str(item.label), href: str(item.href) }))
    .filter((link) => link.label !== "" && link.href !== "");
}

function toFamily(value: unknown): FragranceFamily {
  return (FRAGRANCE_FAMILIES as readonly string[]).includes(str(value))
    ? (value as FragranceFamily)
    : "Aromatic";
}

/**
 * Resolve a stored image reference to something `next/image` can load: an
 * absolute URL or a local `/public` path is used verbatim; anything else is
 * treated as a Supabase Storage object key.
 */
export function resolveImagePath(path: string): string {
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${STORAGE_BUCKET}/${path.replace(/^\/+/, "")}`;
}

/* ----------------------------------------------------------------- mappers */

export function toSiteSettings(row: SettingsRow): SiteSettings {
  return {
    brandName: str(row.brand_name, SITE_SETTINGS.brandName),
    tagline: str(row.tagline, SITE_SETTINGS.tagline),
    description: str(row.description, SITE_SETTINGS.description),
    announcement: str(row.announcement),
    primaryNav: toNavLinks(row.primary_nav),
    footerNav: toNavLinks(row.footer_nav),
    social: toNavLinks(row.social),
    contactEmail: str(row.contact_email, SITE_SETTINGS.contactEmail),
    addressLines: Array.isArray(row.address_lines)
      ? row.address_lines.filter((l): l is string => typeof l === "string")
      : SITE_SETTINGS.addressLines,
    currency: str(row.currency, "USD") || "USD",
    logoUrl: row.logo_url ?? undefined,
    faviconUrl: row.favicon_url ?? undefined,
    heroHeadline: row.hero_headline ?? undefined,
    heroIntro: row.hero_intro ?? undefined,
    homepageIntro: row.homepage_intro ?? undefined,
    brandStory: row.brand_story ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function toSizes(rows: SizeRow[] | null): PerfumeSize[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .slice()
    .sort(byDisplayOrder)
    .map((r) => ({ ml: num(r.ml), price: num(r.price) }))
    .filter((s) => s.ml > 0);
}

function toNotes(rows: NoteRow[] | null) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is NoteRow & { tier: NoteTier } =>
      (NOTE_TIERS as readonly string[]).includes(str(r.tier)),
    )
    .sort(
      (a, b) =>
        NOTE_TIERS.indexOf(a.tier) - NOTE_TIERS.indexOf(b.tier) ||
        byDisplayOrder(a, b),
    )
    .map((r) => ({
      name: str(r.name),
      tier: r.tier,
      description: r.description ?? undefined,
    }))
    .filter((n) => n.name !== "");
}

function toImages(rows: ImageRow[] | null): {
  hero: PerfumeImage | null;
  gallery: PerfumeImage[];
} {
  if (!Array.isArray(rows)) return { hero: null, gallery: [] };
  const ordered = rows
    .slice()
    .sort(byDisplayOrder)
    .filter((r) => str(r.path) !== "");
  const map = (r: ImageRow): PerfumeImage => ({
    src: resolveImagePath(str(r.path)),
    alt: str(r.alt),
  });
  const hero = ordered.find((r) => str(r.role) === "hero");
  return {
    hero: hero ? map(hero) : null,
    gallery: ordered.filter((r) => str(r.role) === "gallery").map(map),
  };
}

/**
 * Map a joined perfume row to a `Perfume`. Returns `null` for a record that
 * cannot render meaningfully (no slug/name, or no priced size) — the caller
 * drops it from lists and 404s a direct hit, rather than showing broken data.
 */
export function toPerfume(row: PerfumeRow): Perfume | null {
  const slug = str(row.slug);
  const name = str(row.name);
  const sizes = toSizes(row.perfume_sizes);
  if (slug === "" || name === "" || sizes.length === 0) return null;

  const { hero, gallery } = toImages(row.perfume_images);
  const heroImage: PerfumeImage =
    hero ?? gallery[0] ?? { src: resolveImagePath("/images/grain.svg"), alt: name };

  const availability = str(row.availability, "available");

  return {
    id: str(row.id, slug),
    slug,
    name,
    concentration: str(row.concentration),
    family: toFamily(row.family),
    tagline: str(row.tagline),
    description: str(row.description),
    perfumer: str(row.perfumer),
    year: num(row.year, new Date().getFullYear()),
    notes: toNotes(row.fragrance_notes),
    sizes,
    hero: heroImage,
    gallery,
    accent: str(row.accent, "#c7ac7c"),
    featured: row.featured === true,
    order: num(row.display_order),
    availability: (AVAILABILITY as readonly string[]).includes(availability)
      ? (availability as PerfumeAvailability)
      : "available",
    isPublished: row.is_published !== false,
    updatedAt: row.updated_at ?? undefined,
  };
}

export const PERFUME_SELECT =
  "*, perfume_sizes(*), fragrance_notes(*), perfume_images(*)";
