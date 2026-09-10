"use client";

import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutSummary } from "./CheckoutSummary";

export function CheckoutView() {
  const { items, ready } = useCart();

  return (
    <div className="pb-32 pt-16 md:pt-24">
      <Container>
        <header className="flex flex-col gap-4">
          <span className="eyebrow flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-champagne/60" />
            Checkout
          </span>
          <h1 className="font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-[1] text-ivory">
            Almost yours
          </h1>
        </header>

        <div className="mt-10 h-px w-full bg-line" />

        {!ready ? (
          <p className="mt-16 text-sm text-smoke">Loading your bag…</p>
        ) : items.length === 0 ? (
          <div className="mt-16 flex flex-col items-start gap-6">
            <p className="max-w-md font-serif text-xl font-light text-ivory-dim">
              Your bag is empty, so there is nothing to check out yet.
            </p>
            <ButtonLink href="/collection" variant="outline">
              Explore the collection
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-12 grid gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <CheckoutForm />
            <CheckoutSummary />
          </div>
        )}
      </Container>
    </div>
  );
}
