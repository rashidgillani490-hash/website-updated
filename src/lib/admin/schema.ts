import { z } from "zod";
import {
  FRAGRANCE_FAMILIES,
  type FragranceFamily,
} from "@/lib/content/types";

/**
 * Validation for everything the admin panel writes. `safeParse` these at the
 * top of each Server Action; field errors go straight to the form, and no raw
 * database error is ever needed for a bad-input case.
 */

const familyEnum = z.enum(
  [...FRAGRANCE_FAMILIES] as [FragranceFamily, ...FragranceFamily[]],
);

const availabilityEnum = z.enum([
  "available",
  "coming-soon",
  "sold-out",
  "archived",
]);

const tierEnum = z.enum(["top", "heart", "base"]);

const slug = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(80, "Slug is too long.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens.",
  );

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour, e.g. #b98a4b.");

const navLink = z.object({
  label: z.string().trim().min(1),
  href: z.string().trim().min(1),
});

/* -------------------------------------------------------------- site settings */

export const settingsSchema = z.object({
  brandName: z.string().trim().min(1, "Website name is required."),
  tagline: z.string().trim().max(200).default(""),
  description: z.string().trim().max(2000).default(""),
  announcement: z.string().trim().max(300).default(""),
  contactEmail: z
    .string()
    .trim()
    .max(200)
    .refine(
      (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Enter a valid email address.",
    )
    .default(""),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "Use a 3-letter ISO code, e.g. USD.")
    .transform((v) => v.toUpperCase()),
  addressLines: z.array(z.string().trim()).max(6).default([]),
  logoUrl: z.string().trim().max(500).optional().default(""),
  faviconUrl: z.string().trim().max(500).optional().default(""),
  heroHeadline: z.string().trim().max(200).optional().default(""),
  heroIntro: z.string().trim().max(600).optional().default(""),
  homepageIntro: z.string().trim().max(600).optional().default(""),
  brandStory: z.string().trim().max(4000).optional().default(""),
  primaryNav: z.array(navLink).max(12).default([]),
  footerNav: z.array(navLink).max(12).default([]),
  social: z.array(navLink).max(12).default([]),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

/* --------------------------------------------------------------- perfume core */

export const perfumeSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  slug,
  concentration: z.string().trim().max(80).default(""),
  family: familyEnum,
  tagline: z.string().trim().max(300).default(""),
  description: z.string().trim().max(6000).default(""),
  perfumer: z.string().trim().max(120).default(""),
  year: z.coerce
    .number()
    .int("Year must be a whole number.")
    .min(1900, "Year looks too early.")
    .max(new Date().getFullYear() + 2, "Year looks too far ahead."),
  accent: hexColor,
  availability: availabilityEnum.default("available"),
  featured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export type PerfumeInput = z.infer<typeof perfumeSchema>;

/* --------------------------------------------------------------------- sizes */

export const sizeSchema = z.object({
  ml: z.coerce.number().int("Size must be a whole number.").positive("Size must be greater than 0."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  displayOrder: z.coerce.number().int().min(0).default(0),
  /** Units on hand. Blank / omitted → not tracked (checkout never blocks on it);
   *  a number → tracked and decremented on checkout. */
  stock: z
    .union([z.literal(""), z.coerce.number().int().min(0, "Stock cannot be negative.")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export const sizesSchema = z
  .array(sizeSchema)
  .min(1, "Add at least one size.")
  .max(12);

export type SizeInput = z.infer<typeof sizeSchema>;

/* --------------------------------------------------------------------- notes */

export const noteSchema = z.object({
  name: z.string().trim().min(1, "Note name is required.").max(80),
  tier: tierEnum,
  description: z.string().trim().max(200).optional().default(""),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const notesSchema = z.array(noteSchema).max(30);

export type NoteInput = z.infer<typeof noteSchema>;

/* -------------------------------------------------------------------- images */

export { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "./image-constants";

export const imageRoleEnum = z.enum(["hero", "gallery"]);

const uuid = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid id.",
  );

export const imageMetaSchema = z.object({
  id: uuid,
  alt: z.string().trim().max(200).default(""),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export type ImageMetaInput = z.infer<typeof imageMetaSchema>;

/** Flatten a ZodError into `{ field: message }` for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
