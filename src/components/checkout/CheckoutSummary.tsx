"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCart } from "@/components/cart/CartProvider";

/** Read-only bag review shown beside the checkout form. */
export function CheckoutSummary() {
  const { items, subtotal, currency } = useCart();

  return (
    <aside className="flex flex-col gap-6 border border-line bg-ink-800 p-6 lg:sticky lg:top-28 lg:self-start">
      <h2 className="font-serif text-lg font-light text-ivory">Order summary</h2>

      <ul className="flex flex-col divide-y divide-line">
        {items.map((item) => (
          <li key={`${item.perfumeId}:${item.ml}`} className="flex gap-4 py-4">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-ink-700">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="truncate font-serif text-sm text-ivory">
                {item.name}
              </span>
              <span className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                {item.ml} ml · Qty {item.qty}
              </span>
            </div>
            <span className="shrink-0 self-center font-serif text-sm text-ivory tabular-nums">
              {formatPrice(item.unitPrice * item.qty, currency)}
            </span>
          </li>
        ))}
      </ul>

      <CartSummary subtotal={subtotal} currency={currency} />
    </aside>
  );
}
