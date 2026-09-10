import { describe, expect, it } from "vitest";
import type { Perfume } from "@/lib/content";
import {
  addLine,
  clampQty,
  itemCount,
  lineKey,
  priceCart,
  removeLine,
  sanitizeItems,
  setQty,
  subtotalOf,
} from "./cart-store";
import type { CartItem } from "./types";

const line = (over: Partial<CartItem> = {}): Omit<CartItem, "qty"> => ({
  perfumeId: "p1",
  slug: "lumiere-noire",
  name: "Lumière Noire",
  concentration: "Extrait",
  ml: 50,
  unitPrice: 245,
  image: "/x.svg",
  imageAlt: "x",
  accent: "#b98a4b",
  ...over,
});

describe("lineKey / clampQty", () => {
  it("keys by perfume + size", () => {
    expect(lineKey("p1", 50)).toBe("p1:50");
  });
  it("clamps quantity to 1..99 and rounds", () => {
    expect(clampQty(0)).toBe(1);
    expect(clampQty(3.6)).toBe(4);
    expect(clampQty(500)).toBe(99);
    expect(clampQty(NaN)).toBe(1);
  });
});

describe("addLine", () => {
  it("appends a new line", () => {
    const items = addLine([], line(), 2);
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(2);
  });
  it("merges quantity for the same perfume + size", () => {
    let items = addLine([], line(), 1);
    items = addLine(items, line(), 3);
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(4);
  });
  it("keeps different sizes as separate lines", () => {
    let items = addLine([], line({ ml: 50 }), 1);
    items = addLine(items, line({ ml: 100, unitPrice: 365 }), 1);
    expect(items).toHaveLength(2);
  });
  it("never exceeds the max on merge", () => {
    let items = addLine([], line(), 90);
    items = addLine(items, line(), 90);
    expect(items[0].qty).toBe(99);
  });
});

describe("setQty / removeLine", () => {
  it("sets an absolute quantity", () => {
    const items = setQty(addLine([], line(), 1), "p1", 50, 5);
    expect(items[0].qty).toBe(5);
  });
  it("removes the line at qty 0 or below", () => {
    const items = setQty(addLine([], line(), 1), "p1", 50, 0);
    expect(items).toHaveLength(0);
  });
  it("removeLine drops only the matching line", () => {
    let items = addLine([], line({ ml: 50 }), 1);
    items = addLine(items, line({ ml: 100 }), 1);
    items = removeLine(items, "p1", 50);
    expect(items).toEqual([expect.objectContaining({ ml: 100 })]);
  });
});

describe("totals", () => {
  it("counts units and sums the subtotal", () => {
    let items = addLine([], line({ ml: 50, unitPrice: 245 }), 2);
    items = addLine(items, line({ ml: 100, unitPrice: 365 }), 1);
    expect(itemCount(items)).toBe(3);
    expect(subtotalOf(items)).toBe(245 * 2 + 365);
  });
});

describe("sanitizeItems", () => {
  it("keeps valid lines and drops junk / duplicates", () => {
    const result = sanitizeItems([
      { ...line(), qty: 2 },
      { perfumeId: "", slug: "x", name: "x", ml: 50, unitPrice: 1, qty: 1 },
      { ...line(), qty: 9 }, // duplicate key
      "nonsense",
      { ...line({ perfumeId: "p2", slug: "b" }), ml: -1, qty: 1 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].qty).toBe(2);
  });
  it("returns [] for non-arrays", () => {
    expect(sanitizeItems(null)).toEqual([]);
    expect(sanitizeItems({})).toEqual([]);
  });
});

describe("priceCart", () => {
  const catalogue: Perfume[] = [
    {
      id: "prf_noire",
      slug: "lumiere-noire",
      name: "Lumière Noire",
      concentration: "Extrait de Parfum",
      family: "Amber",
      tagline: "t",
      description: "d",
      perfumer: "x",
      year: 2021,
      notes: [],
      sizes: [
        { ml: 50, price: 245 },
        { ml: 100, price: 365 },
      ],
      hero: { src: "/h.svg", alt: "h" },
      gallery: [],
      accent: "#b98a4b",
      featured: true,
      order: 1,
      availability: "available",
    },
  ];

  it("re-prices from the catalogue, ignoring the client price", () => {
    const items: CartItem[] = [
      { ...line({ slug: "lumiere-noire", ml: 50, unitPrice: 1 }), qty: 2 },
    ];
    const priced = priceCart(items, catalogue);
    expect(priced.unavailable).toEqual([]);
    expect(priced.items[0].unitPrice).toBe(245);
    expect(priced.items[0].lineTotal).toBe(490);
    expect(priced.subtotal).toBe(490);
    expect(priced.items[0].perfumeId).toBe("prf_noire");
  });

  it("reports lines whose perfume or size is gone", () => {
    const items: CartItem[] = [
      { ...line({ slug: "ghost", ml: 50 }), qty: 1 },
      { ...line({ slug: "lumiere-noire", ml: 30 }), qty: 1 },
    ];
    const priced = priceCart(items, catalogue);
    expect(priced.items).toHaveLength(0);
    expect(priced.unavailable).toHaveLength(2);
  });

  it("treats an archived perfume as unavailable", () => {
    const archived = [{ ...catalogue[0], availability: "archived" as const }];
    const items: CartItem[] = [
      { ...line({ slug: "lumiere-noire", ml: 50 }), qty: 1 },
    ];
    expect(priceCart(items, archived).unavailable).toHaveLength(1);
  });
});
