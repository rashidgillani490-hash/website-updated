import { beforeEach, describe, expect, it } from "vitest";
import { MockContentRepository } from "./mock-repository";

describe("MockContentRepository", () => {
  let repo: MockContentRepository;

  beforeEach(() => {
    repo = new MockContentRepository();
  });

  it("returns site settings", async () => {
    const settings = await repo.getSettings();
    expect(settings.brandName).toBe("Maison Lumière");
    expect(settings.currency).toBe("USD");
    expect(Array.isArray(settings.primaryNav)).toBe(true);
    expect(settings.primaryNav.length).toBeGreaterThan(0);
  });

  it("returns the perfume list sorted by display order, each renderable", async () => {
    const perfumes = await repo.getPerfumes();
    expect(perfumes.length).toBeGreaterThan(0);

    const orders = perfumes.map((p) => p.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));

    for (const p of perfumes) {
      expect(p.slug).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.sizes.length).toBeGreaterThan(0);
      expect(p.hero.src).toBeTruthy();
    }
  });

  it("returns only featured perfumes for the featured list", async () => {
    const featured = await repo.getFeaturedPerfumes();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.every((p) => p.featured)).toBe(true);
  });

  it("returns a perfume by slug", async () => {
    const perfume = await repo.getPerfumeBySlug("lumiere-noire");
    expect(perfume?.name).toBe("Lumière Noire");
    expect(perfume?.notes.some((n) => n.tier === "top")).toBe(true);
    expect(perfume?.notes.some((n) => n.tier === "base")).toBe(true);
  });

  it("returns null for a missing slug", async () => {
    expect(await repo.getPerfumeBySlug("no-such-fragrance")).toBeNull();
  });

  it("lists every published slug", async () => {
    const slugs = await repo.getAllPerfumeSlugs();
    const perfumes = await repo.getPerfumes();
    expect(slugs).toEqual(perfumes.map((p) => p.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("getContent bundles settings and perfumes", async () => {
    const { settings, perfumes } = await repo.getContent();
    expect(settings.brandName).toBeTruthy();
    expect(perfumes.length).toBe((await repo.getPerfumes()).length);
  });
});
