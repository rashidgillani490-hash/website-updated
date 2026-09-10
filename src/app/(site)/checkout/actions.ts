"use server";

import { contentRepository } from "@/lib/content";
import { priceCart } from "@/lib/commerce/cart-store";
import { buildOrder, persistOrder, toOrderSummary } from "@/lib/commerce/orders";
import { fieldErrors, placeOrderSchema } from "@/lib/commerce/schema";
import type { CartItem, OrderSummary } from "@/lib/commerce/types";

export type PlaceOrderResult =
  | { ok: true; summary: OrderSummary }
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string>;
      /** Lines that could not be priced — the client keeps the bag and shows this. */
      unavailable?: string[];
    };

/**
 * Place a cash-on-delivery order.
 *
 * The client sends its bag and customer details; the server re-prices every
 * line against the published catalogue (a tampered price never sticks), builds
 * the canonical order, writes it, and returns only a trimmed summary — no
 * database ids or row data. Validation failures come back as field errors with
 * the bag untouched.
 */
export async function placeOrder(payload: unknown): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  }

  const [catalogue, settings] = await Promise.all([
    contentRepository.getPerfumes(),
    contentRepository.getSettings(),
  ]);

  // Re-price from the live catalogue, ignoring any client-supplied prices.
  const stubItems: CartItem[] = parsed.data.items.map((line) => ({
    perfumeId: "",
    slug: line.slug,
    name: line.name || line.slug,
    concentration: "",
    ml: line.ml,
    unitPrice: 0,
    image: "",
    imageAlt: "",
    accent: "#c7ac7c",
    qty: line.qty,
  }));

  const priced = priceCart(stubItems, catalogue);

  if (priced.unavailable.length > 0) {
    return {
      ok: false,
      error:
        "Some items are no longer available. Please review your bag and try again.",
      unavailable: priced.unavailable,
    };
  }
  if (priced.items.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }

  const order = buildOrder({
    customer: parsed.data.customer,
    items: priced.items,
    paymentMethod: parsed.data.paymentMethod,
    currency: settings.currency,
  });

  const saved = await persistOrder(order);
  if (!saved.ok) {
    return {
      ok: false,
      error: "We couldn't place your order just now. Please try again.",
    };
  }

  return { ok: true, summary: toOrderSummary(order) };
}
