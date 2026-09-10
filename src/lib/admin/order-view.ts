/**
 * Admin-side order shapes and the mapping from database rows to them.
 *
 * The admin panel only ever renders these clean objects — no snake_case, no
 * `null`s, no PostgREST envelope. Pure functions here (mappers, the search
 * predicate, status metadata) are unit-tested directly.
 */

import { ORDER_STATUSES, type OrderStatus } from "@/lib/commerce/types";

/* ------------------------------------------------------------------ row types */

export interface OrderRow {
  id: string | null;
  reference: string | null;
  status: string | null;
  payment_method: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  address_line: string | null;
  city: string | null;
  notes: string | null;
  currency: string | null;
  subtotal: number | string | null;
  total: number | string | null;
  created_at: string | null;
  updated_at: string | null;
  /** PostgREST aggregate embed: `order_items(count)`. */
  order_items?: Array<{ count: number | null }> | null;
}

export interface OrderItemRow {
  id: string | null;
  perfume_id: string | null;
  slug: string | null;
  name: string | null;
  concentration: string | null;
  ml: number | null;
  unit_price: number | string | null;
  qty: number | null;
  line_total: number | string | null;
}

export interface StatusHistoryRow {
  from_status: string | null;
  to_status: string | null;
  actor_type: string | null;
  actor_label: string | null;
  note: string | null;
  created_at: string | null;
}

/* -------------------------------------------------------------- domain shapes */

export interface AdminOrderListItem {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentMethod: string;
  customerName: string;
  /** Carried for search only — not shown as a column. */
  customerPhone: string;
  city: string;
  currency: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderLine {
  name: string;
  concentration: string;
  ml: number;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AdminOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentMethod: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    notes: string;
  };
  items: AdminOrderLine[];
  currency: string;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  from: OrderStatus | null;
  to: OrderStatus;
  /** "system" (checkout), "admin", or "customer". */
  actorType: string;
  /** Admin email, "checkout", etc. — may be empty. */
  actorLabel: string;
  note: string;
  at: string;
}

/* --------------------------------------------------------- status presentation */

export type StatusTone = "pending" | "active" | "done" | "cancelled";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: StatusTone }
> = {
  pending: { label: "Pending", tone: "pending" },
  confirmed: { label: "Confirmed", tone: "active" },
  processing: { label: "Processing", tone: "active" },
  shipped: { label: "Shipped", tone: "active" },
  delivered: { label: "Delivered", tone: "done" },
  cancelled: { label: "Cancelled", tone: "cancelled" },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
};

export function paymentLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

/* ------------------------------------------------------------------- helpers */

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function toStatus(value: unknown): OrderStatus {
  return isOrderStatus(value) ? value : "pending";
}

/* ------------------------------------------------------------------ mappers */

export function toAdminOrderListItem(row: OrderRow): AdminOrderListItem {
  return {
    id: str(row.id),
    reference: str(row.reference),
    status: toStatus(row.status),
    paymentMethod: str(row.payment_method, "cod"),
    customerName: str(row.customer_name),
    customerPhone: str(row.customer_phone),
    city: str(row.city),
    currency: str(row.currency, "USD") || "USD",
    total: num(row.total),
    itemCount: Array.isArray(row.order_items)
      ? num(row.order_items[0]?.count)
      : 0,
    createdAt: str(row.created_at),
  };
}

export function toAdminOrder(row: OrderRow, itemRows: OrderItemRow[]): AdminOrder {
  return {
    id: str(row.id),
    reference: str(row.reference),
    status: toStatus(row.status),
    paymentMethod: str(row.payment_method, "cod"),
    customer: {
      name: str(row.customer_name),
      phone: str(row.customer_phone),
      email: str(row.customer_email),
      address: str(row.address_line),
      city: str(row.city),
      notes: str(row.notes),
    },
    items: (Array.isArray(itemRows) ? itemRows : []).map((i) => ({
      name: str(i.name),
      concentration: str(i.concentration),
      ml: num(i.ml),
      qty: num(i.qty),
      unitPrice: num(i.unit_price),
      lineTotal: num(i.line_total),
    })),
    currency: str(row.currency, "USD") || "USD",
    subtotal: num(row.subtotal),
    total: num(row.total),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  };
}

export function toStatusHistoryEntry(row: StatusHistoryRow): StatusHistoryEntry {
  return {
    from: isOrderStatus(row.from_status) ? row.from_status : null,
    to: toStatus(row.to_status),
    actorType: str(row.actor_type, "system"),
    actorLabel: str(row.actor_label),
    note: str(row.note),
    at: str(row.created_at),
  };
}

/* ---------------------------------------------------------- search / filter */

export interface OrderQuery {
  q?: string;
  status?: OrderStatus | "all";
}

/** Free-text match across reference, customer name, phone and city. */
export function matchesQuery(order: AdminOrderListItem, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [order.reference, order.customerName, order.customerPhone, order.city]
    .some((field) => field.toLowerCase().includes(needle));
}

export function filterOrders(
  orders: AdminOrderListItem[],
  query: OrderQuery,
): AdminOrderListItem[] {
  const status = query.status && query.status !== "all" ? query.status : null;
  const q = (query.q ?? "").trim();
  return orders.filter(
    (o) => (!status || o.status === status) && (!q || matchesQuery(o, q)),
  );
}
