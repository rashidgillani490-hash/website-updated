import "server-only";

import type { AdminOrder } from "@/lib/admin/order-view";

/**
 * Order notifications.
 *
 * There is no email/SMS provider configured for this project. Until one is
 * wired up, this records — server-side only — that a notification *would* be
 * sent, with the minimum data needed to act on it (reference, city, totals).
 * It deliberately does NOT log the customer's name, phone, email or address.
 *
 * A real provider (Resend / SES / Twilio …) plugs in here: read
 * `order.customer.email` / `.phone` and send, keeping this call site unchanged.
 */
export async function notifyOrderCancelled(order: AdminOrder): Promise<void> {
  const hasContact = Boolean(order.customer.email || order.customer.phone);
  console.info(
    `[notify] order ${order.reference} cancelled — customer notification pending ` +
      `(provider not configured). ${order.items.length} item(s), ` +
      `${order.currency} ${order.total}, ${order.customer.city}. ` +
      `contact on file: ${hasContact ? "yes" : "no"}.`,
  );
}
