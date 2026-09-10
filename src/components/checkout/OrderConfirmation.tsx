"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { PAYMENT_METHODS, type OrderSummary } from "@/lib/commerce/types";

const LAST_ORDER_KEY = "ml.lastOrder";

function readSummary(): OrderSummary | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as OrderSummary) : null;
  } catch {
    return null;
  }
}

export function OrderConfirmation() {
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSummary(readSummary());
    setLoaded(true);
  }, []);

  const methodLabel =
    PAYMENT_METHODS.find((m) => m.id === summary?.paymentMethod)?.label ??
    "Cash on delivery";

  return (
    <div className="pb-32 pt-16 md:pt-24">
      <Container>
        <span className="eyebrow flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-champagne/60" />
          Order received
        </span>
        <h1 className="mt-4 font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-[1.05] text-ivory">
          Thank you{summary ? `, ${summary.customerName}` : ""}.
        </h1>
        <p className="mt-6 max-w-xl text-[0.98rem] leading-relaxed text-ivory-dim">
          Your order is <strong className="text-ivory">pending</strong>. We&rsquo;ll
          call to confirm your delivery{summary ? ` in ${summary.city}` : ""} and
          arrange a time. Payment is {methodLabel.toLowerCase()}.
        </p>

        {loaded && summary ? (
          <div className="mt-12 max-w-xl border border-line">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <span className="text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                Reference
              </span>
              <span className="font-serif text-lg text-ivory">
                {summary.reference}
              </span>
            </div>
            <ul className="flex flex-col divide-y divide-line px-6">
              {summary.items.map((item, i) => (
                <li
                  key={`${item.name}-${item.ml}-${i}`}
                  className="flex items-baseline justify-between gap-4 py-4 text-sm"
                >
                  <span className="text-ivory-dim">
                    {item.name}
                    <span className="text-smoke">
                      {" "}
                      · {item.ml} ml · ×{item.qty}
                    </span>
                  </span>
                  <span className="shrink-0 font-serif text-ivory tabular-nums">
                    {formatPrice(item.lineTotal, summary.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-line px-6 py-4">
              <span className="text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                Total
              </span>
              <span className="font-serif text-xl text-ivory tabular-nums">
                {formatPrice(summary.total, summary.currency)}
              </span>
            </div>
          </div>
        ) : loaded ? (
          <p className="mt-12 max-w-xl text-sm text-smoke">
            Your order has been placed. If you need the details again, write to the
            atelier and we&rsquo;ll look it up.
          </p>
        ) : null}

        <div className="mt-12 flex flex-wrap gap-4">
          <ButtonLink href="/collection" variant="solid">
            Continue exploring
          </ButtonLink>
          <ButtonLink href="/" variant="ghost">
            Back to home
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
