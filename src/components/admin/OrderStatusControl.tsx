"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/commerce/types";
import { ORDER_STATUS_META } from "@/lib/admin/order-view";
import { updateOrderStatus } from "@/app/admin/actions";

interface Props {
  id: string;
  status: OrderStatus;
  /** Compact = the inline control on a list row; full = the detail page. */
  variant?: "compact" | "full";
}

export function OrderStatusControl({ id, status, variant = "full" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const onChange = (next: string) => {
    if (next === status) return;
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const res = await updateOrderStatus(id, next);
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? "Change failed.");
      }
    });
  };

  return (
    <div className={variant === "full" ? "flex flex-col gap-2" : "flex flex-col items-end gap-1"}>
      <select
        aria-label="Order status"
        disabled={pending}
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className={
          "border border-line bg-ink-800 text-ivory focus:border-champagne focus:outline-none disabled:opacity-50 " +
          (variant === "full"
            ? "px-3 py-2 text-sm"
            : "px-2 py-1 text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim")
        }
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_META[s].label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-[0.65rem] text-red-600">{error}</span>
      ) : saved ? (
        <span className="text-[0.65rem] text-emerald-700">Saved</span>
      ) : null}
    </div>
  );
}
