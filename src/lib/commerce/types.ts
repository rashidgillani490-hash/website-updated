/**
 * Commerce domain model — cart lines, orders, payment methods.
 *
 * The storefront cart is a client-only, self-contained snapshot: each line
 * carries the name / price / image it was added with, so the bag survives a
 * catalogue edit. Orders are re-priced against the content repository on the
 * server before they are written, so a tampered client price never sticks.
 */

/** Order lifecycle, in fulfilment order. New orders start `pending`. */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/** Payment methods. Cash on delivery only today; the list is the seam for
 *  adding online providers later without touching the checkout UI. */
export interface PaymentMethodOption {
  id: "cod";
  label: string;
  description: string;
  /** A disabled entry can be shown as "coming soon" without being selectable. */
  enabled: boolean;
}

export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  {
    id: "cod",
    label: "Cash on delivery",
    description: "Pay in cash when your order is delivered.",
    enabled: true,
  },
];

export type PaymentMethodId = PaymentMethodOption["id"];

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = "cod";

/** Quantity bounds for a single cart line. */
export const MIN_QTY = 1;
export const MAX_QTY = 99;

/**
 * One line in the bag. `perfumeId` + `ml` identify it; the rest is a display
 * snapshot taken at add time.
 */
export interface CartItem {
  perfumeId: string;
  slug: string;
  name: string;
  concentration: string;
  ml: number;
  /** Price per unit when the line was added, in the store's base currency. */
  unitPrice: number;
  image: string;
  imageAlt: string;
  accent: string;
  qty: number;
}

/** Customer details collected at checkout. */
export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  notes?: string;
}

/** A priced order line, server-authoritative. */
export interface OrderItem {
  perfumeId: string;
  slug: string;
  name: string;
  concentration: string;
  ml: number;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

/**
 * A placed order. `id` is the database key; `reference` is the short,
 * human-facing code shown to the customer. No database internals beyond these
 * are ever sent to the client.
 */
export interface Order {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentMethod: PaymentMethodId;
  customer: OrderCustomer;
  items: OrderItem[];
  currency: string;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * The trimmed order view returned to the browser after checkout and shown on
 * the confirmation screen. Deliberately excludes `id` and any raw row data.
 */
export interface OrderSummary {
  reference: string;
  status: OrderStatus;
  paymentMethod: PaymentMethodId;
  items: Array<Pick<OrderItem, "name" | "concentration" | "ml" | "qty" | "lineTotal">>;
  currency: string;
  subtotal: number;
  total: number;
  customerName: string;
  city: string;
}
