import Link from "next/link";
import { getOrderAdmin } from "@/lib/admin/context";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { isOrderStatus, paymentLabel } from "@/lib/admin/order-view";
import { OrderFilters } from "@/components/admin/OrderFilters";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { q = "", status = "" } = await searchParams;
  const statusFilter = isOrderStatus(status) ? status : "all";

  const orders = await (
    await getOrderAdmin()
  ).list({ q, status: statusFilter });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">Orders</span>
        <h1 className="font-serif text-3xl font-light text-ivory">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
          {q || statusFilter !== "all" ? " matching" : ""}
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-ivory-dim">
          Every checkout lands here as <em>Pending</em>. Open an order to see the
          customer and items, and to move it along.
        </p>
      </header>

      <OrderFilters initialQuery={q} initialStatus={status} />

      {orders.length === 0 ? (
        <p className="border border-line bg-ink-800 p-6 text-sm text-ivory-dim">
          No orders {q || statusFilter !== "all" ? "match those filters" : "yet"}.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex flex-col gap-3 py-5 transition-colors duration-200 hover:bg-ink-800 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-sm text-ivory">
                    {o.reference}
                  </span>
                  <span className="text-xs text-smoke">
                    {o.customerName || "—"} &middot; {o.city || "—"} &middot;{" "}
                    {o.itemCount} {o.itemCount === 1 ? "item" : "items"} &middot;{" "}
                    {paymentLabel(o.paymentMethod)}
                  </span>
                  <span className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                    {formatDateTime(o.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-serif text-base text-ivory tabular-nums">
                    {formatPrice(o.total, o.currency)}
                  </span>
                  <OrderStatusBadge status={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
