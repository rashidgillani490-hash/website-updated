import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminRepository } from "./repository";

/* --------------------------------------------------- recording fake client */

interface Call {
  table: string;
  op: "insert" | "update" | "delete" | "upsert";
  payload: unknown;
}

function fakeClient(opts: {
  error?: { message: string; code?: string };
  insertReturns?: unknown;
} = {}) {
  const calls: Call[] = [];

  function builder(table: string) {
    const result = { data: null as unknown, error: opts.error ?? null };
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    chain.select = self;
    chain.eq = self;
    chain.order = self;
    chain.limit = self;
    chain.single = async () => ({
      data: opts.error ? null : (opts.insertReturns ?? { id: "new-id" }),
      error: opts.error ?? null,
    });
    chain.maybeSingle = async () => ({
      data: opts.error ? null : (opts.insertReturns ?? null),
      error: opts.error ?? null,
    });
    chain.insert = (payload: unknown) => {
      calls.push({ table, op: "insert", payload });
      return chain;
    };
    chain.update = (payload: unknown) => {
      calls.push({ table, op: "update", payload });
      return chain;
    };
    chain.delete = () => {
      calls.push({ table, op: "delete", payload: null });
      return chain;
    };
    chain.upsert = (payload: unknown) => {
      calls.push({ table, op: "upsert", payload });
      return chain;
    };
    chain.then = (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(onFulfilled, onRejected);
    return chain;
  }

  const db = { from: (t: string) => builder(t) } as unknown as SupabaseClient;
  return { db, calls };
}

const perfumeInput = {
  name: "Test",
  slug: "test",
  concentration: "EdP",
  family: "Amber" as const,
  tagline: "t",
  description: "d",
  perfumer: "p",
  year: 2021,
  accent: "#b98a4b",
  availability: "available" as const,
  featured: false,
  isPublished: true,
  displayOrder: 3,
};

/* -------------------------------------------------------------------- tests */

describe("AdminRepository writes", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  it("createPerfume inserts a snake_case row and returns the id", async () => {
    const { db, calls } = fakeClient({ insertReturns: { id: "abc" } });
    const result = await new AdminRepository(db).createPerfume(perfumeInput);
    expect(result).toEqual({ ok: true, value: { id: "abc" } });
    const insert = calls.find((c) => c.table === "perfumes" && c.op === "insert");
    expect(insert?.payload).toMatchObject({
      slug: "test",
      is_published: true,
      display_order: 3,
      availability: "available",
    });
  });

  it("createPerfume reports a taken slug from a unique violation", async () => {
    const { db } = fakeClient({ error: { message: "dup", code: "23505" } });
    const result = await new AdminRepository(db).createPerfume(perfumeInput);
    expect(result).toEqual({ ok: false, error: "That slug is already taken." });
  });

  it("createPerfume returns a plain message on any other error", async () => {
    const { db } = fakeClient({ error: { message: "connection reset" } });
    const result = await new AdminRepository(db).createPerfume(perfumeInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toMatch(/connection reset/);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("updatePerfume updates by id", async () => {
    const { db, calls } = fakeClient();
    const result = await new AdminRepository(db).updatePerfume("id-1", perfumeInput);
    expect(result.ok).toBe(true);
    expect(calls.some((c) => c.table === "perfumes" && c.op === "update")).toBe(
      true,
    );
  });

  it("patchPerfume only sends the changed columns", async () => {
    const { db, calls } = fakeClient();
    await new AdminRepository(db).patchPerfume("id-1", { featured: true });
    const update = calls.find((c) => c.op === "update");
    expect(update?.payload).toEqual({ featured: true });
  });

  it("patchPerfume with no changes is a no-op success", async () => {
    const { db, calls } = fakeClient();
    const result = await new AdminRepository(db).patchPerfume("id-1", {});
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("deletePerfume deletes by id", async () => {
    const { db, calls } = fakeClient();
    const result = await new AdminRepository(db).deletePerfume("id-1");
    expect(result.ok).toBe(true);
    expect(calls.some((c) => c.table === "perfumes" && c.op === "delete")).toBe(
      true,
    );
  });

  it("setPerfumeSizes replaces the whole set (delete then insert)", async () => {
    const { db, calls } = fakeClient();
    const result = await new AdminRepository(db).setPerfumeSizes("id-1", [
      { ml: 50, price: 245, displayOrder: 0 },
      { ml: 100, price: 365, displayOrder: 1 },
    ]);
    expect(result.ok).toBe(true);
    expect(calls[0]).toMatchObject({ table: "perfume_sizes", op: "delete" });
    expect(calls[1]).toMatchObject({ table: "perfume_sizes", op: "insert" });
    expect((calls[1].payload as unknown[]).length).toBe(2);
  });

  it("setPerfumeNotes replaces the whole set", async () => {
    const { db, calls } = fakeClient();
    await new AdminRepository(db).setPerfumeNotes("id-1", [
      { name: "Iris", tier: "heart", description: "", displayOrder: 0 },
    ]);
    expect(calls[0]).toMatchObject({ table: "fragrance_notes", op: "delete" });
    expect(calls[1]).toMatchObject({ table: "fragrance_notes", op: "insert" });
  });

  it("updateSettings upserts the singleton row", async () => {
    const { db, calls } = fakeClient();
    const result = await new AdminRepository(db).updateSettings({
      brandName: "New Name",
      tagline: "",
      description: "",
      announcement: "",
      contactEmail: "",
      currency: "EUR",
      addressLines: [],
      logoUrl: "",
      faviconUrl: "",
      heroHeadline: "",
      heroIntro: "",
      homepageIntro: "",
      brandStory: "",
      primaryNav: [],
      footerNav: [],
      social: [],
    });
    expect(result.ok).toBe(true);
    const upsert = calls.find((c) => c.op === "upsert");
    expect(upsert?.payload).toMatchObject({ id: "default", brand_name: "New Name" });
  });

  it("addPerfumeImage inserts an image row", async () => {
    const { db, calls } = fakeClient({ insertReturns: { id: "img-1" } });
    const result = await new AdminRepository(db).addPerfumeImage("id-1", {
      role: "gallery",
      path: "test/a.png",
      alt: "bottle",
      displayOrder: 0,
    });
    expect(result).toEqual({ ok: true, value: { id: "img-1" } });
    expect(calls[0]).toMatchObject({ table: "perfume_images", op: "insert" });
  });

  it("reorderImages issues one ordered update per id", async () => {
    const { db, calls } = fakeClient();
    await new AdminRepository(db).reorderImages("id-1", ["a", "b", "c"]);
    const updates = calls.filter(
      (c) => c.table === "perfume_images" && c.op === "update",
    );
    expect(updates).toHaveLength(3);
    expect(updates.map((u) => u.payload)).toEqual([
      { display_order: 0 },
      { display_order: 1 },
      { display_order: 2 },
    ]);
  });
});
