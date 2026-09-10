"use client";

import { MAX_QTY, MIN_QTY } from "@/lib/commerce/types";

interface QtyStepperProps {
  qty: number;
  onChange: (qty: number) => void;
  label?: string;
}

/** Minimal −/+ control on a hairline frame. Decrementing at 1 removes the line. */
export function QtyStepper({ qty, onChange, label = "Quantity" }: QtyStepperProps) {
  return (
    <div
      className="inline-flex items-center border border-line text-ivory"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center text-ivory-dim transition-colors duration-300 hover:text-ivory"
      >
        <span aria-hidden>&minus;</span>
      </button>
      <span
        aria-live="polite"
        className="min-w-8 text-center font-serif text-sm tabular-nums"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= MAX_QTY}
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center text-ivory-dim transition-colors duration-300 hover:text-ivory disabled:opacity-30"
      >
        <span aria-hidden>+</span>
      </button>
      <span className="sr-only">
        {qty <= MIN_QTY ? "Minimum reached; decreasing removes the item." : ""}
      </span>
    </div>
  );
}
