import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseContentRepository } from "./supabase-repository";
import { MockContentRepository } from "./mock-repository";
import type { PerfumeRow } from "./db-mappers";

/* ---------------------------------------------------------- fake Supabase */

interface TableResult {
  rows?: unknown[];
  single?: unknown;
  error?: unknown;
}

/**
 * Minimal stand-in for the PostgREST query builder: `select` / `eq` / `order`
 * chain, the builder is awaitable (list result), and `maybeSingle()` resolves
 * to the single-row result.
 */
function fakeSupabase(tables: Record<string, TableResult>): SupabaseClient {
  const client = {
    from(table: string) {
      const cfg = tables[table] ?? {};
      const list = { data: cfg.rows ?? [], error: cfg.error ?? null };
      const single = { data: cfg.single ?? null, error: cfg.error ?? null };
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      builder.select = chain;
      builder.eq = chain;
      builder.order = chain;
      builder.maybeSingle = () => Promise.resolve(single);
      builder.then = (
        onFulfilled: (value: unknown) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(list).then(onFulfilled, onRejected);
      return builder;
    },
  };
  return client as unknown as SupabaseClient;
}

function perfumeRow(overrides: Partial<PerfumeRow> = {}): PerfumeRow {
  return {
    id: "row-1",
    slug: "lumiere-noire",
    name: "Lumière Noire",
    concentration: "Extrait de Parfum",
    family: "Amber",
    tagline: "Amber and incense.",
    description: "A long story.",
    perfumer: "Élodie Rançon",
    year: 2021,
    accent: "#b98a4b",
    featured: true,
    availability: "available",
    display_order: 1,
    updated_at: "2026-01-01T00:00:00.000Z",
    perfume_sizes: [{ ml: 50, price: 245, display_order: 0 }],
    fragrance_notes: [
      { name: "Saffron", tier: "top", description: null, display_order: 0 },
      { name: "Vetiver", tier: "base", description: "earthy", display_order: 1 },
    ],
    perfume_images: [
      { role: "hero", path: "/images/noire-atmosphere.svg", alt: "hero", display_order: 0 },
      { role: "gallery", path: "/images/noire-bottle.svg", alt: "bottle", display_order: 0 },
    ],
    ...overrides,
  };
}

const settingsRow = {
  brand_name: "DB Brand",
  tagline: "DB tagline",
  description: "DB description",
  announcement: "DB announcement",
  primary_nav: [{ label: "Collection", href: "/collection" }],
  footer_nav: [],
  social: [],
  contact_email: "hi@example.com",
  address_lines: ["1 Rue Test", "Paris"],
  currency: "EUR",
  logo_url: null,
  favicon_url: null,
  hero_headline: null,
  hero_intro: null,
  homepage_intro: null,
  brand_story: null,
  updated_at: "2026-01-01T00:00:00.000Z",
};

/* -------------------------------------------------------------------- tests */

describe("SupabaseContentRepository", () => {
  let fallback: MockContentRepository;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fallback = new MockContentRepository();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  const make = (tables: Record<string, TableResult>) =>
    new SupabaseContentRepository(fakeSupabase(tables), fallback);

  it("connects and maps site settings from a row", async () => {
    const repo = make({ site_settings: { single: settingsRow } });
    const settings = await repo.getSettings();
    expect(settings.brandName).toBe("DB Brand");
    expect(settings.currency).toBe("EUR");
    expect(settings.primaryNav).toEqual([{ label: "Collection", href: "/collection" }]);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("falls back to mock settings when there is no settings row", async () => {
    const repo = make({ site_settings: { single: null } });
    const settings = await repo.getSettings();
    expect(settings.brandName).toBe("Maison Lumière");
  });

  it("falls back to mock settings on a database error (no raw error surfaced)", async () => {
    const repo = make({ site_settings: { error: { message: "boom" } } });
    const settings = await repo.getSettings();
    expect(settings.brandName).toBe("Maison Lumière");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("maps the perfume list and drops rows that cannot render", async () => {
    const repo = make({
      perfumes: {
        rows: [
          perfumeRow(),
          perfumeRow({ slug: "no-price", perfume_sizes: [] }), // invalid: no size
          perfumeRow({ slug: "", name: "" }), // invalid: no identity
        ],
      },
    });
    const perfumes = await repo.getPerfumes();
    expect(perfumes).toHaveLength(1);
    expect(perfumes[0].slug).toBe("lumiere-noire");
    expect(perfumes[0].sizes[0]).toEqual({ ml: 50, price: 245 });
    expect(perfumes[0].hero.src).toBe("/images/noire-atmosphere.svg");
    expect(perfumes[0].notes.map((n) => n.tier)).toEqual(["top", "base"]);
  });

  it("returns the featured list", async () => {
    const repo = make({ perfumes: { rows: [perfumeRow({ featured: true })] } });
    const featured = await repo.getFeaturedPerfumes();
    expect(featured).toHaveLength(1);
    expect(featured.every((p) => p.featured)).toBe(true);
  });

  it("returns a single perfume by slug", async () => {
    const repo = make({ perfumes: { single: perfumeRow() } });
    const perfume = await repo.getPerfumeBySlug("lumiere-noire");
    expect(perfume?.name).toBe("Lumière Noire");
    expect(perfume?.availability).toBe("available");
  });

  it("returns null for a missing perfume", async () => {
    const repo = make({ perfumes: { single: null } });
    expect(await repo.getPerfumeBySlug("ghost")).toBeNull();
  });

  it("returns [] on a list database error without throwing", async () => {
    const repo = make({ perfumes: { error: { message: "down" } } });
    await expect(repo.getPerfumes()).resolves.toEqual([]);
    await expect(repo.getFeaturedPerfumes()).resolves.toEqual([]);
    await expect(repo.getAllPerfumeSlugs()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns null on a single-perfume database error without throwing", async () => {
    const repo = make({ perfumes: { error: { message: "down" } } });
    await expect(repo.getPerfumeBySlug("lumiere-noire")).resolves.toBeNull();
  });

  it("lists published slugs", async () => {
    const repo = make({
      perfumes: { rows: [{ slug: "a" }, { slug: "b" }, { slug: null }] },
    });
    expect(await repo.getAllPerfumeSlugs()).toEqual(["a", "b"]);
  });

  it("getContent bundles settings and perfumes, degrading independently", async () => {
    const repo = make({
      site_settings: { single: settingsRow },
      perfumes: { rows: [perfumeRow()] },
    });
    const { settings, perfumes } = await repo.getContent();
    expect(settings.brandName).toBe("DB Brand");
    expect(perfumes).toHaveLength(1);
  });
});
