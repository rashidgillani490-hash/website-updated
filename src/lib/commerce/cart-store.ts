/**
 * Pure cart maths — no React, no storage, no server. Shared by the client
 * `CartProvider` and the checkout re-pricing step, and unit-tested directly.
 */

import type { Perfume } from "@/lib/content";
import {
  MAX_QTY,
  MIN_QTY,
  type CartItem,
  type OrderItem,
} from "./types";

/** Stable identity for a bag line: a perfume at a given size. */
export function lineKey(perfumeId: string, ml: number): string {
  return `${perfumeId}:${ml}`;
}

export function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return MIN_QTY;
  const n = Math.round(qty);
  if (n < MIN_QTY) return MIN_QTY;
  if (n > MAX_QTY) return MAX_QTY;
  return n;
}

/** Add a line, or bump the quantity of the matching one. Returns a new array. */
export function addLine(
  items: CartItem[],
  line: Omit<CartItem, "qty">,
  qty = 1,
): CartItem[] {
  const key = lineKey(line.perfumeId, line.ml);
  const existing = items.find((i) => lineKey(i.perfumeId, i.ml) === key);
  if (existing) {
    return items.map((i) =>
      i === existing ? { ...i, qty: clampQty(i.qty + qty) } : i,
    );
  }
  return [...items, { ...line, qty: clampQty(qty) }];
}

/** Set an absolute quantity. `qty <= 0` removes the line. */
export function setQty(
  items: CartItem[],
  perfumeId: string,
  ml: number,
  qty: number,
): CartItem[] {
  const key = lineKey(perfumeId, ml);
  if (qty <= 0) {
    return items.filter((i) => lineKey(i.perfumeId, i.ml) !== key);
  }
  return items.map((i) =>
    lineKey(i.perfumeId, i.ml) === key ? { ...i, qty: clampQty(qty) } : i,
  );
}

export function removeLine(
  items: CartItem[],
  perfumeId: string,
  ml: number,
): CartItem[] {
  const key = lineKey(perfumeId, ml);
  return items.filter((i) => lineKey(i.perfumeId, i.ml) !== key);
}

export function itemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function subtotalOf(items: CartItem[]): number {
  return round2(items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0));
}

/** Drop anything that isn't a well-formed line (defensive against old / hand-
 *  edited localStorage). */
export function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: CartItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const perfumeId = typeof r.perfumeId === "string" ? r.perfumeId : "";
    const slug = typeof r.slug === "string" ? r.slug : "";
    const name = typeof r.name === "string" ? r.name : "";
    const ml = typeof r.ml === "number" ? Math.round(r.ml) : NaN;
    const unitPrice = typeof r.unitPrice === "number" ? r.unitPrice : NaN;
    if (!perfumeId || !slug || !name || !(ml > 0) || !(unitPrice >= 0)) continue;
    const key = lineKey(perfumeId, ml);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      perfumeId,
      slug,
      name,
      concentration: typeof r.concentration === "string" ? r.concentration : "",
      ml,
      unitPrice,
      image: typeof r.image === "string" ? r.image : "",
      imageAlt: typeof r.imageAlt === "string" ? r.imageAlt : name,
      accent: typeof r.accent === "string" ? r.accent : "#c7ac7c",
      qty: clampQty(typeof r.qty === "number" ? r.qty : 1),
    });
  }
  return out;
}

export interface PricedCart {
  items: OrderItem[];
  subtotal: number;
  /** Names of lines that could no longer be priced (unpublished / size gone). */
  unavailable: string[];
}

/** Only `available` (or an unset availability, i.e. the sample data) can be
 *  ordered. `coming-soon` / `sold-out` / `archived` all block checkout. */
export function isOrderable(perfume: Perfume): boolean {
  return !perfume.availability || perfume.availability === "available";
}

/**
 * Re-price the bag against the live catalogue. Server-authoritative: the
 * client's `unitPrice` is ignored, the repository price wins, and a line whose
 * perfume is gone, unpublished, no longer sold in that size, or not currently
 * `available` is reported rather than silently dropped or quietly ordered.
 */
export function priceCart(items: CartItem[], catalogue: Perfume[]): PricedCart {
  const bySlug = new Map(catalogue.map((p) => [p.slug, p]));
  const priced: OrderItem[] = [];
  const unavailable: string[] = [];

  for (const item of items) {
    const perfume = bySlug.get(item.slug);
    const size = perfume?.sizes.find((s) => s.ml === item.ml);
    if (!perfume || !size || !isOrderable(perfume)) {
      const label = perfume ? perfume.name : item.name;
      unavailable.push(`${label} · ${item.ml} ml`);
      continue;
    }
    const qty = clampQty(item.qty);
    priced.push({
      perfumeId: perfume.id,
      slug: perfume.slug,
      name: perfume.name,
      concentration: perfume.concentration,
      ml: size.ml,
      unitPrice: round2(size.price),
      qty,
      lineTotal: round2(size.price * qty),
    });
  }

  return {
    items: priced,
    subtotal: round2(priced.reduce((s, i) => s + i.lineTotal, 0)),
    unavailable,
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
