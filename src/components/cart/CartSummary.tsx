"use client";

import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  currency: string;
  /** `total` is shown as its own line even though it equals `subtotal` today. */
  total?: number;
  note?: string;
}

/** Subtotal / total block. Shipping and tax are settled off-line for COD, so
 *  they are not itemised here. */
export function CartSummary({
  subtotal,
  currency,
  total = subtotal,
  note = "Shipping arranged on delivery.",
}: CartSummaryProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-5 text-sm">
      <div className="flex items-center justify-between text-ivory-dim">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatPrice(subtotal, currency)}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
          Total
        </span>
        <span className="font-serif text-xl text-ivory tabular-nums">
          {formatPrice(total, currency)}
        </span>
      </div>
      {note ? <p className="text-[0.7rem] text-smoke">{note}</p> : null}
    </div>
  );
}
