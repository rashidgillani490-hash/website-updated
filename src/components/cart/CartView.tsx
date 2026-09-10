"use client";

import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { useCart } from "./CartProvider";
import { CartLineRow } from "./CartLineRow";
import { CartSummary } from "./CartSummary";

/** Full-page bag. The drawer is the quick view; this is for a considered edit. */
export function CartView() {
  const { items, subtotal, count, currency, ready } = useCart();

  return (
    <div className="pb-32 pt-16 md:pt-24">
      <Container>
        <header className="flex flex-col gap-4">
          <span className="eyebrow flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-champagne/60" />
            Your bag
          </span>
          <h1 className="font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-[1] text-ivory">
            {ready && count > 0
              ? `${count} ${count === 1 ? "item" : "items"}`
              : "Your bag"}
          </h1>
        </header>

        <div className="mt-10 h-px w-full bg-line" />

        {!ready ? (
          <p className="mt-16 text-sm text-smoke">Loading your bag…</p>
        ) : items.length === 0 ? (
          <div className="mt-16 flex flex-col items-start gap-6">
            <p className="max-w-md font-serif text-xl font-light text-ivory-dim">
              There is nothing here yet. Every fragrance is chosen best on skin —
              take your time.
            </p>
            <ButtonLink href="/collection" variant="outline">
              Explore the collection
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-10 grid gap-14 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <CartLineRow
                  key={`${item.perfumeId}:${item.ml}`}
                  item={item}
                  variant="page"
                />
              ))}
            </div>

            <aside className="flex flex-col gap-6 self-start lg:sticky lg:top-28">
              <CartSummary subtotal={subtotal} currency={currency} />
              <ButtonLink href="/checkout" variant="solid" className="w-full">
                Proceed to checkout
              </ButtonLink>
              <ButtonLink href="/collection" variant="ghost" className="w-full">
                Continue shopping
              </ButtonLink>
            </aside>
          </div>
        )}
      </Container>
    </div>
  );
}
