import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContentRepository,
  Perfume,
  SiteSettings,
  StorefrontContent,
} from "./types";
import {
  PERFUME_SELECT,
  toPerfume,
  toSiteSettings,
  type PerfumeRow,
  type SettingsRow,
} from "./db-mappers";

const SETTINGS_ID = "default";

function logError(op: string, error: unknown): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  // Server-side only. Raw database errors never reach the response.
  console.error(`[content] SupabaseContentRepository.${op} failed: ${message}`);
}

/**
 * Production repository. Reads published content through the anon client, so
 * every query is bounded by Row Level Security. Every method degrades safely:
 *   - settings error / no row  -> the mock settings (site chrome must render)
 *   - list error               -> [] (an empty collection, not a crash)
 *   - single error / no row    -> null (caller 404s)
 *   - a row that fails mapping  -> dropped from the list
 * No raw database error is ever surfaced to the user.
 */
export class SupabaseContentRepository implements ContentRepository {
  constructor(
    private readonly db: SupabaseClient,
    /** Used only when settings cannot be read. */
    private readonly fallback: ContentRepository,
  ) {}

  async getSettings(): Promise<SiteSettings> {
    try {
      const { data, error } = await this.db
        .from("site_settings")
        .select("*")
        .eq("id", SETTINGS_ID)
        .maybeSingle<SettingsRow>();
      if (error) throw error;
      if (!data) return this.fallback.getSettings();
      return toSiteSettings(data);
    } catch (error) {
      logError("getSettings", error);
      return this.fallback.getSettings();
    }
  }

  async getPerfumes(): Promise<Perfume[]> {
    return this.queryPerfumeList("getPerfumes", false);
  }

  async getFeaturedPerfumes(): Promise<Perfume[]> {
    return this.queryPerfumeList("getFeaturedPerfumes", true);
  }

  async getPerfumeBySlug(slug: string): Promise<Perfume | null> {
    try {
      const { data, error } = await this.db
        .from("perfumes")
        .select(PERFUME_SELECT)
        .eq("slug", slug)
        .maybeSingle<PerfumeRow>();
      if (error) throw error;
      return data ? toPerfume(data) : null;
    } catch (error) {
      logError("getPerfumeBySlug", error);
      return null;
    }
  }

  async getAllPerfumeSlugs(): Promise<string[]> {
    try {
      const { data, error } = await this.db
        .from("perfumes")
        .select("slug")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .map((row) => (row as { slug: unknown }).slug)
        .filter((slug): slug is string => typeof slug === "string" && slug !== "");
    } catch (error) {
      logError("getAllPerfumeSlugs", error);
      return [];
    }
  }

  async getContent(): Promise<StorefrontContent> {
    const [settings, perfumes] = await Promise.all([
      this.getSettings(),
      this.getPerfumes(),
    ]);
    return { settings, perfumes };
  }

  private async queryPerfumeList(
    op: string,
    featuredOnly: boolean,
  ): Promise<Perfume[]> {
    try {
      let query = this.db
        .from("perfumes")
        .select(PERFUME_SELECT)
        .order("display_order", { ascending: true });
      if (featuredOnly) {
        query = query.eq("featured", true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as PerfumeRow[])
        .map(toPerfume)
        .filter((perfume): perfume is Perfume => perfume !== null);
    } catch (error) {
      logError(op, error);
      return [];
    }
  }
}
