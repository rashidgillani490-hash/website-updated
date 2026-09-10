import type { OrderStatus } from "@/lib/commerce/types";
import { ORDER_STATUS_META, type StatusTone } from "@/lib/admin/order-view";

const TONE: Record<StatusTone, string> = {
  pending: "border-champagne text-champagne",
  active: "border-ivory-dim text-ivory",
  done: "border-emerald-400/60 text-emerald-300",
  cancelled: "border-line text-smoke",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center border px-2 py-1 text-[0.6rem] uppercase tracking-[var(--tracking-wide)] ${TONE[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
}
