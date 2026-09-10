"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { easeLuxe } from "@/lib/motion/variants";
import { useDialog } from "@/hooks/useDialog";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useCart } from "./CartProvider";
import { CartLineRow } from "./CartLineRow";
import { CartSummary } from "./CartSummary";

/** Right-hand slide-over bag. Mounted once by <CartProvider>. */
export function CartDrawer() {
  const { items, subtotal, count, currency, isOpen, closeCart } = useCart();
  const panelRef = useDialog<HTMLDivElement>(isOpen, closeCart);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60]"
          initial="hidden"
          animate="shown"
          exit="hidden"
        >
          <motion.button
            type="button"
            aria-label="Close bag"
            onClick={closeCart}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/70 backdrop-blur-sm"
            variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
            transition={{ duration: 0.3, ease: easeLuxe }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-full w-full flex-col bg-ink-800 outline-none sm:max-w-md"
            variants={{
              hidden: { x: "100%" },
              shown: { x: 0 },
            }}
            transition={{ duration: 0.45, ease: easeLuxe }}
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2
                id="cart-drawer-title"
                className="font-serif text-xl font-light text-ivory"
              >
                Your bag{count > 0 ? ` (${count})` : ""}
              </h2>
              <button
                type="button"
                onClick={closeCart}
                className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:text-ivory"
              >
                Close
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                <p className="font-serif text-lg font-light text-ivory-dim">
                  Your bag is empty.
                </p>
                <ButtonLink href="/collection" variant="outline" onClick={closeCart}>
                  Explore the collection
                </ButtonLink>
              </div>
            ) : (
              <>
                <div className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  {items.map((item) => (
                    <CartLineRow
                      key={`${item.perfumeId}:${item.ml}`}
                      item={item}
                      variant="drawer"
                      onNavigate={closeCart}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-4 border-t border-line px-6 py-6">
                  <CartSummary subtotal={subtotal} currency={currency} />
                  <ButtonLink
                    href="/checkout"
                    variant="solid"
                    onClick={closeCart}
                    className="w-full"
                  >
                    Checkout
                  </ButtonLink>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/cart"
                      onClick={closeCart}
                      className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke underline-offset-4 transition-colors duration-300 hover:text-ivory hover:underline"
                    >
                      View full bag
                    </Link>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 text-[0.65rem]"
                      onClick={closeCart}
                    >
                      Continue shopping
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
