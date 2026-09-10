"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/lib/commerce/types";
import { useCart } from "./CartProvider";
import { QtyStepper } from "./QtyStepper";

interface CartLineRowProps {
  item: CartItem;
  /** Drawer uses the compact layout; the cart page uses the roomy one. */
  variant?: "drawer" | "page";
  onNavigate?: () => void;
}

export function CartLineRow({
  item,
  variant = "drawer",
  onNavigate,
}: CartLineRowProps) {
  const { currency, setQty, remove } = useCart();
  const lineTotal = item.unitPrice * item.qty;
  const roomy = variant === "page";

  return (
    <div className="flex gap-4 py-6">
      <Link
        href={`/fragrance/${item.slug}`}
        onClick={onNavigate}
        className={
          "relative shrink-0 overflow-hidden bg-ink-700 " +
          (roomy ? "h-32 w-24" : "h-24 w-20")
        }
        style={{ boxShadow: `inset 0 0 0 1px ${item.accent}22` }}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.imageAlt}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/fragrance/${item.slug}`}
              onClick={onNavigate}
              className="font-serif text-lg font-light leading-tight text-ivory transition-colors duration-300 hover:text-champagne"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
              {item.concentration ? `${item.concentration} · ` : ""}
              {item.ml} ml
            </p>
          </div>
          <span className="shrink-0 font-serif text-base text-ivory tabular-nums">
            {formatPrice(lineTotal, currency)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <QtyStepper
            qty={item.qty}
            onChange={(q) => setQty(item.perfumeId, item.ml, q)}
          />
          <button
            type="button"
            onClick={() => remove(item.perfumeId, item.ml)}
            className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke underline-offset-4 transition-colors duration-300 hover:text-ivory hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
