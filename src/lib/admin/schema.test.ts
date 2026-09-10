import { describe, expect, it } from "vitest";
import {
  fieldErrors,
  noteSchema,
  perfumeSchema,
  settingsSchema,
  sizeSchema,
  sizesSchema,
} from "./schema";

const validPerfume = {
  name: "Lumière Noire",
  slug: "lumiere-noire",
  concentration: "Extrait de Parfum",
  family: "Amber",
  tagline: "Amber and incense.",
  description: "A story.",
  perfumer: "Élodie Rançon",
  year: "2021",
  accent: "#b98a4b",
  availability: "available",
  featured: true,
  isPublished: true,
  displayOrder: "1",
};

describe("perfumeSchema", () => {
  it("accepts a valid perfume and coerces numeric strings", () => {
    const result = perfumeSchema.safeParse(validPerfume);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(2021);
      expect(result.data.displayOrder).toBe(1);
    }
  });

  it("rejects an invalid slug", () => {
    const result = perfumeSchema.safeParse({
      ...validPerfume,
      slug: "Lumière Noire",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).slug).toMatch(/lowercase/i);
    }
  });

  it("rejects a non-hex accent colour", () => {
    const result = perfumeSchema.safeParse({ ...validPerfume, accent: "red" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown family", () => {
    const result = perfumeSchema.safeParse({
      ...validPerfume,
      family: "Gourmand",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    const result = perfumeSchema.safeParse({ ...validPerfume, name: "" });
    expect(result.success).toBe(false);
  });
});

describe("sizeSchema / sizesSchema", () => {
  it("accepts ml > 0 and price >= 0", () => {
    expect(sizeSchema.safeParse({ ml: "50", price: "245" }).success).toBe(true);
    expect(sizeSchema.safeParse({ ml: "50", price: "0" }).success).toBe(true);
  });

  it("rejects ml <= 0", () => {
    expect(sizeSchema.safeParse({ ml: "0", price: "10" }).success).toBe(false);
    expect(sizeSchema.safeParse({ ml: "-5", price: "10" }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(sizeSchema.safeParse({ ml: "50", price: "-1" }).success).toBe(false);
  });

  it("requires at least one size", () => {
    expect(sizesSchema.safeParse([]).success).toBe(false);
    expect(sizesSchema.safeParse([{ ml: "50", price: "1" }]).success).toBe(true);
  });

  it("stock: blank / omitted → null; a number → that number; negative → error", () => {
    const blank = sizeSchema.safeParse({ ml: "50", price: "1", stock: "" });
    expect(blank.success && blank.data.stock).toBe(null);

    const omitted = sizeSchema.safeParse({ ml: "50", price: "1" });
    expect(omitted.success && omitted.data.stock).toBe(null);

    const tracked = sizeSchema.safeParse({ ml: "50", price: "1", stock: "12" });
    expect(tracked.success && tracked.data.stock).toBe(12);

    expect(sizeSchema.safeParse({ ml: "50", price: "1", stock: "-1" }).success).toBe(
      false,
    );
  });
});

describe("noteSchema", () => {
  it("accepts each tier", () => {
    for (const tier of ["top", "heart", "base"]) {
      expect(noteSchema.safeParse({ name: "Iris", tier }).success).toBe(true);
    }
  });

  it("rejects an unknown tier", () => {
    expect(noteSchema.safeParse({ name: "Iris", tier: "middle" }).success).toBe(
      false,
    );
  });

  it("rejects an empty note name", () => {
    expect(noteSchema.safeParse({ name: "", tier: "top" }).success).toBe(false);
  });
});

describe("settingsSchema", () => {
  const base = {
    brandName: "Maison Lumière",
    currency: "usd",
    contactEmail: "",
  };

  it("requires a website name and upper-cases the currency", () => {
    const result = settingsSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currency).toBe("USD");
  });

  it("rejects an empty website name", () => {
    expect(
      settingsSchema.safeParse({ ...base, brandName: "" }).success,
    ).toBe(false);
  });

  it("rejects a bad currency code", () => {
    expect(
      settingsSchema.safeParse({ ...base, currency: "US" }).success,
    ).toBe(false);
  });

  it("accepts an empty email but rejects a malformed one", () => {
    expect(
      settingsSchema.safeParse({ ...base, contactEmail: "" }).success,
    ).toBe(true);
    expect(
      settingsSchema.safeParse({ ...base, contactEmail: "not-an-email" }).success,
    ).toBe(false);
  });
});
