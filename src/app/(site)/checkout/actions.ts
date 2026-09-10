"use server";

import { headers } from "next/headers";
import { contentRepository } from "@/lib/content";
import { priceCart } from "@/lib/commerce/cart-store";
import { buildOrder, persistOrder, toOrderSummary } from "@/lib/commerce/orders";
import { fieldErrors, placeOrderSchema } from "@/lib/commerce/schema";
import {
  checkRateLimit,
  clientKeyFromHeaders,
  getIdempotentResult,
  isDuplicateIntent,
  orderIntentHash,
  releaseIntent,
  rememberIdempotentResult,
} from "@/lib/commerce/rate-limit";
import { MAX_ORDER_TOTAL, type CartItem, type OrderSummary } from "@/lib/commerce/types";

export type PlaceOrderResult =
  | { ok: true; summary: OrderSummary }
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string>;
      /** Lines that could not be priced — the client keeps the bag and shows this. */
      unavailable?: string[];
      /** Set when throttled, so the client can show a countdown. */
      retryAfterSeconds?: number;
    };

/**
 * Place a cash-on-delivery order. No login required.
 *
 * Abuse handling (all in-process — see `rate-limit.ts` for what a real
 * distributed limiter would add):
 *   1. sliding-window request limit per client (proxy IP)
 *   2. idempotency — a retry with the same key returns the first result
 *   3. content-hash dedupe — an identical order within 30s is rejected
 *   4. a sanity ceiling on the order total
 *
 * The client sends its bag and customer details; the server re-prices every
 * line against the published catalogue (a tampered price never sticks), builds
 * the canonical order, writes it, and returns only a trimmed summary — no
 * database ids or row data. Validation failures come back as field errors with
 * the bag untouched.
 */
export async function placeOrder(payload: unknown): Promise<PlaceOrderResult> {
  // 1. Throttle before any catalogue / DB work.
  const key = clientKeyFromHeaders(await headers());
  const rate = checkRateLimit(key);
  if (!rate.ok) {
    const retryAfterSeconds = Math.max(1, Math.ceil(rate.retryAfterMs / 1000));
    return {
      ok: false,
      error: `Too many checkout attempts. Please wait ${retryAfterSeconds}s and try again.`,
      retryAfterSeconds,
    };
  }

  // 2. Validate.
  const parsed = placeOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  }

  // 3. Idempotent replay: this attempt already produced an order.
  const idemKey = parsed.data.idempotencyKey;
  if (idemKey) {
    const prior = getIdempotentResult(idemKey);
    if (prior) return { ok: true, summary: prior };
  }

  // 4. Double-submit backstop: identical intent seen in the last 30s.
  const intentHash = orderIntentHash(parsed.data.customer, parsed.data.items);
  if (isDuplicateIntent(intentHash)) {
    return {
      ok: false,
      error:
        "That order was just submitted. Give it a moment before trying again.",
    };
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
    releaseIntent(intentHash);
    return {
      ok: false,
      error:
        "Some items are no longer available. Please review your bag and try again.",
      unavailable: priced.unavailable,
    };
  }
  if (priced.items.length === 0) {
    releaseIntent(intentHash);
    return { ok: false, error: "Your bag is empty." };
  }
  if (priced.subtotal > MAX_ORDER_TOTAL) {
    releaseIntent(intentHash);
    return {
      ok: false,
      error: "This order is too large to place online. Please contact the atelier.",
    };
  }

  const order = buildOrder({
    customer: parsed.data.customer,
    items: priced.items,
    paymentMethod: parsed.data.paymentMethod,
    currency: settings.currency,
  });

  const saved = await persistOrder(order);
  if (!saved.ok) {
    // No order was created — let the customer retry immediately.
    releaseIntent(intentHash);
    return {
      ok: false,
      error: "We couldn't place your order just now. Please try again.",
    };
  }

  const summary = toOrderSummary(order);
  if (idemKey) rememberIdempotentResult(idemKey, summary);
  return { ok: true, summary };
}
