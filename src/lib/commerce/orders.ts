import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabaseClient } from "@/lib/supabase/admin";
import { round2 } from "./cart-store";
import {
  type Order,
  type OrderCustomer,
  type OrderItem,
  type OrderSummary,
  type PaymentMethodId,
} from "./types";

/** Unambiguous alphabet — no 0/O/1/I/L. */
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function orderReference(): string {
  const bytes =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(6))
      : Uint8Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
  let code = "";
  for (const b of bytes) code += REF_ALPHABET[b % REF_ALPHABET.length];
  return `ML-${code}`;
}

export interface BuildOrderInput {
  customer: OrderCustomer;
  items: OrderItem[];
  paymentMethod: PaymentMethodId;
  currency: string;
}

/**
 * Assemble a fully-priced `Order` from server-authoritative line items. Pure —
 * no I/O — so the money maths is unit-testable. `total` is kept separate from
 * `subtotal` even though they are equal today (no shipping / tax yet).
 */
export function buildOrder(input: BuildOrderInput): Order {
  const subtotal = round2(input.items.reduce((s, i) => s + i.lineTotal, 0));
  const now = new Date().toISOString();
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    reference: orderReference(),
    status: "pending",
    paymentMethod: input.paymentMethod,
    customer: input.customer,
    items: input.items,
    currency: input.currency,
    subtotal,
    total: subtotal,
    createdAt: now,
    updatedAt: now,
  };
}

/** The safe, trimmed view handed back to the browser. No `id`, no row data. */
export function toOrderSummary(order: Order): OrderSummary {
  return {
    reference: order.reference,
    status: order.status,
    paymentMethod: order.paymentMethod,
    items: order.items.map((i) => ({
      name: i.name,
      concentration: i.concentration,
      ml: i.ml,
      qty: i.qty,
      lineTotal: i.lineTotal,
    })),
    currency: order.currency,
    subtotal: order.subtotal,
    total: order.total,
    customerName: order.customer.name,
    city: order.customer.city,
  };
}

function serviceConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Write the order. Customers are anonymous, so RLS blocks the anon role from
 * the `orders` tables entirely — the service-role client (server-only, key
 * never shipped) is the single write path.
 *
 * Not-configured behaviour:
 *   - `NODE_ENV === "production"` (any real deployment, incl. Vercel preview):
 *     FAIL — a live checkout must never accept a COD order it cannot record.
 *   - otherwise (local `next dev` / test): log and return ok, so the flow can
 *     be exercised end to end without a backend.
 */
export type PersistResult =
  | { ok: true }
  | { ok: false; outOfStock?: string[] };

/** Extract slugs from one or more `insufficient_stock:<slug>` markers. */
function outOfStockSlugs(message: string): string[] {
  return [...message.matchAll(/insufficient_stock:([a-z0-9-]+)/gi)].map(
    (m) => m[1],
  );
}

export async function persistOrder(
  order: Order,
  /** Injected in tests; production always uses the service-role client. */
  clientOverride?: SupabaseClient,
): Promise<PersistResult> {
  let db = clientOverride;
  if (!db) {
    if (!serviceConfigured()) {
      if (process.env.NODE_ENV === "production") {
        console.error(
          `[commerce] persistOrder ${order.reference}: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured — refusing to accept an unrecorded order.`,
        );
        return { ok: false };
      }
      console.info(
        `[commerce] Supabase not configured — order ${order.reference} not persisted (dev: ${order.items.length} lines, ${order.currency} ${order.total}).`,
      );
      return { ok: true };
    }
    db = getServiceSupabaseClient();
  }

  try {
    // One transactional RPC: creates the order + lines and decrements tracked
    // stock atomically, so concurrent checkouts cannot oversell and a failure
    // anywhere rolls the whole order back. See migration 20260910160000.
    const { error } = await db.rpc("place_order", {
      p_reference: order.reference,
      p_currency: order.currency,
      p_customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email ?? "",
        address: order.customer.address,
        city: order.customer.city,
        notes: order.customer.notes ?? "",
      },
      p_items: order.items.map((i) => ({
        perfume_id: i.perfumeId || null,
        slug: i.slug,
        name: i.name,
        concentration: i.concentration,
        ml: i.ml,
        unit_price: i.unitPrice,
        qty: i.qty,
        line_total: i.lineTotal,
      })),
    });

    if (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message: unknown }).message)
          : "";
      const stockSlugs = outOfStockSlugs(message);
      if (stockSlugs.length > 0) {
        return { ok: false, outOfStock: stockSlugs };
      }
      throw error;
    }

    return { ok: true };
  } catch (error) {
    // Log a stable code, not the raw message — a PostgREST/Postgres error can
    // echo column values, and this order carries customer PII.
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code: unknown }).code)
        : "unknown";
    console.error(`[commerce] persistOrder ${order.reference} failed (code ${code}).`);
    return { ok: false };
  }
}
