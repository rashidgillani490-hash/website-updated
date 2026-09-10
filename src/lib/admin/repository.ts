import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Perfume, SiteSettings } from "@/lib/content/types";
import { MockContentRepository } from "@/lib/content/mock-repository";
import { SupabaseContentRepository } from "@/lib/content/supabase-repository";
import {
  PERFUME_SELECT,
  toPerfume,
  type PerfumeRow,
} from "@/lib/content/db-mappers";
import type {
  NoteInput,
  PerfumeInput,
  SettingsInput,
  SizeInput,
} from "./schema";

export type WriteResult<T = void> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const OK: WriteResult = { ok: true, value: undefined };

function fail(op: string, error: unknown): WriteResult<never> {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  console.error(`[admin] ${op} failed: ${message}`);
  return { ok: false, error: "That didn't save. Please try again." };
}

/* ---------------------------------------------- domain input → database row */

function perfumeRow(input: PerfumeInput) {
  return {
    name: input.name,
    slug: input.slug,
    concentration: input.concentration,
    family: input.family,
    tagline: input.tagline,
    description: input.description,
    perfumer: input.perfumer,
    year: input.year,
    accent: input.accent,
    availability: input.availability,
    featured: input.featured,
    is_published: input.isPublished,
    display_order: input.displayOrder,
  };
}

function settingsRow(input: SettingsInput) {
  return {
    id: "default",
    brand_name: input.brandName,
    tagline: input.tagline,
    description: input.description,
    announcement: input.announcement,
    contact_email: input.contactEmail,
    currency: input.currency,
    address_lines: input.addressLines,
    logo_url: input.logoUrl || null,
    favicon_url: input.faviconUrl || null,
    hero_headline: input.heroHeadline || null,
    hero_intro: input.heroIntro || null,
    homepage_intro: input.homepageIntro || null,
    brand_story: input.brandStory || null,
    primary_nav: input.primaryNav,
    footer_nav: input.footerNav,
    social: input.social,
  };
}

export interface PerfumePatch {
  featured?: boolean;
  isPublished?: boolean;
  availability?: PerfumeInput["availability"];
  displayOrder?: number;
}

export interface NewImageRow {
  role: "hero" | "gallery";
  path: string;
  alt: string;
  displayOrder: number;
}

export interface AdminImage {
  id: string;
  role: "hero" | "gallery";
  /** Storage object key, or an absolute / local `/public` URL. */
  path: string;
  alt: string;
  displayOrder: number;
}

/**
 * The admin read + write surface. Reads reuse `SupabaseContentRepository`
 * unchanged — but because this client carries the admin's session, the
 * "admins read all" RLS policy means drafts are visible too. Writes are plain
 * PostgREST mutations, still bounded by the `is_admin()` write policies.
 */
export class AdminRepository {
  private readonly reads: SupabaseContentRepository;

  constructor(private readonly db: SupabaseClient) {
    this.reads = new SupabaseContentRepository(db, new MockContentRepository());
  }

  /* -------------------------------------------------------------- reads */

  getSettings(): Promise<SiteSettings> {
    return this.reads.getSettings();
  }

  getPerfumes(): Promise<Perfume[]> {
    return this.reads.getPerfumes();
  }

  async getPerfumeById(id: string): Promise<Perfume | null> {
    try {
      const { data, error } = await this.db
        .from("perfumes")
        .select(PERFUME_SELECT)
        .eq("id", id)
        .maybeSingle<PerfumeRow>();
      if (error) throw error;
      return data ? toPerfume(data) : null;
    } catch (error) {
      console.error("[admin] getPerfumeById failed:", error);
      return null;
    }
  }

  /* ---------------------------------------------------- settings write */

  async updateSettings(input: SettingsInput): Promise<WriteResult> {
    try {
      const { error } = await this.db
        .from("site_settings")
        .upsert(settingsRow(input), { onConflict: "id" });
      if (error) throw error;
      return OK;
    } catch (error) {
      return fail("updateSettings", error);
    }
  }

  /* ---------------------------------------------------- perfume writes */

  async createPerfume(input: PerfumeInput): Promise<WriteResult<{ id: string }>> {
    try {
      const { data, error } = await this.db
        .from("perfumes")
        .insert(perfumeRow(input))
        .select("id")
        .single();
      if (error) throw error;
      return { ok: true, value: { id: String((data as { id: string }).id) } };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, error: "That slug is already taken." };
      }
      return fail("createPerfume", error);
    }
  }

  async updatePerfume(id: string, input: PerfumeInput): Promise<WriteResult> {
    try {
      const { error } = await this.db
        .from("perfumes")
        .update(perfumeRow(input))
        .eq("id", id);
      if (error) throw error;
      return OK;
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, error: "That slug is already taken." };
      }
      return fail("updatePerfume", error);
    }
  }

  async patchPerfume(id: string, patch: PerfumePatch): Promise<WriteResult> {
    try {
      const row: Record<string, unknown> = {};
      if (patch.featured !== undefined) row.featured = patch.featured;
      if (patch.isPublished !== undefined) row.is_published = patch.isPublished;
      if (patch.availability !== undefined) row.availability = patch.availability;
      if (patch.displayOrder !== undefined) row.display_order = patch.displayOrder;
      if (Object.keys(row).length === 0) return OK;
      const { error } = await this.db.from("perfumes").update(row).eq("id", id);
      if (error) throw error;
      return OK;
    } catch (error) {
      return fail("patchPerfume", error);
    }
  }

  async deletePerfume(id: string): Promise<WriteResult> {
    try {
      const { error } = await this.db.from("perfumes").delete().eq("id", id);
      if (error) throw error;
      return OK;
    } catch (error) {
      return fail("deletePerfume", error);
    }
  }

  /* ------------------------------------------------------ sizes / notes */

  async setPerfumeSizes(
    perfumeId: string,
    sizes: SizeInput[],
  ): Promise<WriteResult> {
    try {
      const del = await this.db
        .from("perfume_sizes")
        .delete()
        .eq("perfume_id", perfumeId);
      if (del.error) throw del.error;
      if (sizes.length > 0) {
        const ins = await this.db.from("perfume_sizes").insert(
          sizes.map((s, i) => ({
            perfume_id: perfumeId,
            ml: s.ml,
            price: s.price,
            display_order: s.displayOrder ?? i,
            stock: s.stock ?? null,
          })),
        );
        if (ins.error) throw ins.error;
      }
      return OK;
    } catch (error) {
      return fail("setPerfumeSizes", error);
    }
  }

  async setPerfumeNotes(
    perfumeId: string,
    notes: NoteInput[],
  ): Promise<WriteResult> {
    try {
      const del = await this.db
        .from("fragrance_notes")
        .delete()
        .eq("perfume_id", perfumeId);
      if (del.error) throw del.error;
      if (notes.length > 0) {
        const ins = await this.db.from("fragrance_notes").insert(
          notes.map((n, i) => ({
            perfume_id: perfumeId,
            name: n.name,
            tier: n.tier,
            description: n.description || null,
            display_order: n.displayOrder ?? i,
          })),
        );
        if (ins.error) throw ins.error;
      }
      return OK;
    } catch (error) {
      return fail("setPerfumeNotes", error);
    }
  }

  /* ----------------------------------------------------------- images */

  /** Raw image rows (path is a Storage key or local URL) for a perfume. */
  async listImagePaths(
    perfumeId: string,
  ): Promise<{ id: string; path: string }[]> {
    const { data, error } = await this.db
      .from("perfume_images")
      .select("id, path")
      .eq("perfume_id", perfumeId);
    if (error) {
      console.error("[admin] listImagePaths failed:", error.message);
      return [];
    }
    return (data ?? []) as { id: string; path: string }[];
  }

  /** Ordered image rows for the admin image manager. */
  async getPerfumeImages(perfumeId: string): Promise<AdminImage[]> {
    const { data, error } = await this.db
      .from("perfume_images")
      .select("id, role, path, alt, display_order")
      .eq("perfume_id", perfumeId)
      .order("display_order", { ascending: true });
    if (error) {
      console.error("[admin] getPerfumeImages failed:", error.message);
      return [];
    }
    return (data ?? []).map((r) => {
      const row = r as {
        id: string;
        role: string;
        path: string;
        alt: string | null;
        display_order: number | null;
      };
      return {
        id: row.id,
        role: row.role === "hero" ? "hero" : "gallery",
        path: row.path,
        alt: row.alt ?? "",
        displayOrder: row.display_order ?? 0,
      };
    });
  }

  async getHeroImage(
    perfumeId: string,
  ): Promise<{ id: string; path: string } | null> {
    const { data, error } = await this.db
      .from("perfume_images")
      .select("id, path")
      .eq("perfume_id", perfumeId)
      .eq("role", "hero")
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string; path: string }>();
    if (error || !data) return null;
    return data;
  }

  async addPerfumeImage(
    perfumeId: string,
    image: NewImageRow,
  ): Promise<WriteResult<{ id: string }>> {
    try {
      const { data, error } = await this.db
        .from("perfume_images")
        .insert({
          perfume_id: perfumeId,
          role: image.role,
          path: image.path,
          alt: image.alt,
          display_order: image.displayOrder,
        })
        .select("id")
        .single();
      if (error) throw error;
      return { ok: true, value: { id: String((data as { id: string }).id) } };
    } catch (error) {
      return fail("addPerfumeImage", error);
    }
  }

  async updateImageMeta(
    imageId: string,
    meta: { alt?: string; displayOrder?: number },
  ): Promise<WriteResult> {
    try {
      const row: Record<string, unknown> = {};
      if (meta.alt !== undefined) row.alt = meta.alt;
      if (meta.displayOrder !== undefined) row.display_order = meta.displayOrder;
      if (Object.keys(row).length === 0) return OK;
      const { error } = await this.db
        .from("perfume_images")
        .update(row)
        .eq("id", imageId);
      if (error) throw error;
      return OK;
    } catch (error) {
      return fail("updateImageMeta", error);
    }
  }

  async deleteImageRow(imageId: string): Promise<WriteResult> {
    try {
      const { error } = await this.db
        .from("perfume_images")
        .delete()
        .eq("id", imageId);
      if (error) throw error;
      return OK;
    } catch (error) {
      return fail("deleteImageRow", error);
    }
  }

  async getImagePath(imageId: string): Promise<string | null> {
    const { data, error } = await this.db
      .from("perfume_images")
      .select("path")
      .eq("id", imageId)
      .maybeSingle<{ path: string }>();
    if (error || !data) return null;
    return data.path;
  }

  async reorderImages(
    perfumeId: string,
    orderedIds: string[],
  ): Promise<WriteResult> {
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await this.db
          .from("perfume_images")
          .update({ display_order: i })
          .eq("id", orderedIds[i])
          .eq("perfume_id", perfumeId);
        if (error) throw error;
      }
      return OK;
    } catch (error) {
      return fail("reorderImages", error);
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}
