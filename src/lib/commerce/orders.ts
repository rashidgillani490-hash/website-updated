import "server-only";

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
 * never shipped) is the single write path. When Supabase is not configured the
 * order is logged and the checkout still succeeds, so local dev / preview keep
 * working end to end.
 */
export async function persistOrder(
  order: Order,
): Promise<{ ok: true } | { ok: false }> {
  if (!serviceConfigured()) {
    console.info(
      `[commerce] Supabase not configured — order ${order.reference} not persisted (${order.items.length} lines, ${order.currency} ${order.total}).`,
    );
    return { ok: true };
  }

  try {
    const db = getServiceSupabaseClient();

    const { error: orderError } = await db.from("orders").insert({
      id: order.id,
      reference: order.reference,
      status: order.status,
      payment_method: order.paymentMethod,
      customer_name: order.customer.name,
      customer_phone: order.customer.phone,
      customer_email: order.customer.email ?? null,
      address_line: order.customer.address,
      city: order.customer.city,
      notes: order.customer.notes ?? null,
      currency: order.currency,
      subtotal: order.subtotal,
      total: order.total,
    });
    if (orderError) throw orderError;

    const { error: itemsError } = await db.from("order_items").insert(
      order.items.map((i) => ({
        order_id: order.id,
        perfume_id: i.perfumeId || null,
        slug: i.slug,
        name: i.name,
        concentration: i.concentration,
        ml: i.ml,
        unit_price: i.unitPrice,
        qty: i.qty,
        line_total: i.lineTotal,
      })),
    );
    if (itemsError) {
      // Best effort: don't leave a headless order behind.
      await db.from("orders").delete().eq("id", order.id);
      throw itemsError;
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
