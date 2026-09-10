"use client";

import { useCart } from "./CartProvider";

/**
 * Header bag trigger with a live count. Renders a stable label during SSR /
 * before the cart hydrates so there's no count flash or layout shift.
 */
export function CartButton({ className }: { className?: string }) {
  const { count, ready, openCart } = useCart();
  const showCount = ready && count > 0;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={showCount ? `Open bag, ${count} item${count === 1 ? "" : "s"}` : "Open bag"}
      className={
        "group inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-500 hover:text-ivory " +
        (className ?? "")
      }
    >
      <span>Bag</span>
      <span
        aria-hidden
        className={
          "inline-flex h-5 min-w-5 items-center justify-center border px-1 font-serif text-[0.7rem] tabular-nums transition-colors duration-500 " +
          (showCount
            ? "border-champagne text-champagne"
            : "border-line text-smoke")
        }
      >
        {showCount ? count : 0}
      </span>
    </button>
  );
}
