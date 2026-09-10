import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderAdmin } from "@/lib/admin/context";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { paymentLabel } from "@/lib/admin/order-view";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await (await getOrderAdmin()).get(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/orders"
          className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke transition-colors duration-300 hover:text-ivory"
        >
          ← Orders
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-3xl font-light text-ivory">
              {order.reference}
            </h1>
            <span className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
              Placed {formatDateTime(order.createdAt)}
              {order.updatedAt && order.updatedAt !== order.createdAt
                ? ` · updated ${formatDateTime(order.updatedAt)}`
                : ""}
            </span>
          </div>
          <div className="flex flex-col items-start gap-2">
            <span className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
              Status
            </span>
            <OrderStatusControl id={order.id} status={order.status} />
          </div>
        </div>
      </header>

      <div className="grid gap-10 md:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-lg font-light text-ivory">Customer</h2>
          <dl className="flex flex-col gap-3 border-t border-line pt-4 text-sm">
            <Row label="Name" value={order.customer.name} />
            <Row label="Phone" value={order.customer.phone} />
            <Row label="Email" value={order.customer.email || "—"} />
            <Row label="Delivery address" value={order.customer.address} />
            <Row label="City" value={order.customer.city} />
            {order.customer.notes ? (
              <Row label="Order notes" value={order.customer.notes} />
            ) : null}
          </dl>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-lg font-light text-ivory">Payment</h2>
          <dl className="flex flex-col gap-3 border-t border-line pt-4 text-sm">
            <Row label="Method" value={paymentLabel(order.paymentMethod)} />
            <Row
              label="Subtotal"
              value={formatPrice(order.subtotal, order.currency)}
            />
            <Row
              label="Total"
              value={formatPrice(order.total, order.currency)}
            />
          </dl>
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-lg font-light text-ivory">
          Items ({order.items.length})
        </h2>
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                <th className="px-4 py-3 font-normal">Fragrance</th>
                <th className="px-4 py-3 font-normal">Size</th>
                <th className="px-4 py-3 font-normal">Qty</th>
                <th className="px-4 py-3 text-right font-normal">Unit</th>
                <th className="px-4 py-3 text-right font-normal">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.items.map((item, i) => (
                <tr key={`${item.name}-${item.ml}-${i}`}>
                  <td className="px-4 py-3 text-ivory">
                    {item.name}
                    {item.concentration ? (
                      <span className="block text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                        {item.concentration}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ivory-dim">{item.ml} ml</td>
                  <td className="px-4 py-3 text-ivory-dim tabular-nums">
                    {item.qty}
                  </td>
                  <td className="px-4 py-3 text-right text-ivory-dim tabular-nums">
                    {formatPrice(item.unitPrice, order.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-ivory tabular-nums">
                    {formatPrice(item.lineTotal, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line">
                <td colSpan={4} className="px-4 py-3 text-right text-smoke">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-serif text-ivory tabular-nums">
                  {formatPrice(order.total, order.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
        {label}
      </dt>
      <dd className="text-ivory-dim sm:max-w-[60%] sm:text-right">{value}</dd>
    </div>
  );
}
