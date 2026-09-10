"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { fieldErrors, placeOrderSchema } from "@/lib/commerce/schema";
import {
  DEFAULT_PAYMENT_METHOD,
  PAYMENT_METHODS,
  type PaymentMethodId,
} from "@/lib/commerce/types";
import { placeOrder } from "@/app/(site)/checkout/actions";

const LAST_ORDER_KEY = "ml.lastOrder";

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
};

export function CheckoutForm() {
  const router = useRouter();
  const { items, clear } = useCart();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState(EMPTY);
  const [method, setMethod] = useState<PaymentMethodId>(DEFAULT_PAYMENT_METHOD);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [unavailable, setUnavailable] = useState<string[]>([]);

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[`customer.${key}`] && !prev[key]) return prev;
      const next = { ...prev };
      delete next[`customer.${key}`];
      delete next[key];
      return next;
    });
  };

  const err = (name: keyof typeof form) =>
    errors[`customer.${name}`] ?? errors[name];

  const lines = useMemo(
    () => items.map((i) => ({ slug: i.slug, ml: i.ml, qty: i.qty, name: i.name })),
    [items],
  );

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);
    setUnavailable([]);

    const payload = {
      customer: {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address,
        city: form.city,
        notes: form.notes || undefined,
      },
      items: lines,
      paymentMethod: method,
    };

    const parsed = placeOrderSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setFormError("Please check the highlighted fields.");
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await placeOrder(parsed.data);
      if (result.ok) {
        try {
          window.sessionStorage.setItem(
            LAST_ORDER_KEY,
            JSON.stringify(result.summary),
          );
        } catch {
          // Confirmation page falls back to a generic message.
        }
        clear();
        router.push("/checkout/confirmation");
        return;
      }
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        setFormError("Please check the highlighted fields.");
      } else {
        setFormError(result.error ?? "Something went wrong. Please try again.");
        setUnavailable(result.unavailable ?? []);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-10">
      <fieldset className="flex flex-col gap-5">
        <legend className="eyebrow mb-2">Delivery details</legend>

        <Field label="Full name" error={err("name")}>
          <input
            className={input(err("name"))}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            required
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" error={err("phone")}>
            <input
              className={input(err("phone"))}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </Field>
          <Field label="Email" hint="Optional" error={err("email")}>
            <input
              className={input(err("email"))}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              type="email"
              autoComplete="email"
            />
          </Field>
        </div>

        <Field label="Delivery address" error={err("address")}>
          <input
            className={input(err("address"))}
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            autoComplete="street-address"
            required
          />
        </Field>

        <Field label="City" error={err("city")}>
          <input
            className={input(err("city"))}
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            autoComplete="address-level2"
            required
          />
        </Field>

        <Field label="Order notes" hint="Optional" error={err("notes")}>
          <textarea
            className={input(err("notes")) + " min-h-24 py-3"}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Delivery instructions, a gift message…"
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="eyebrow mb-2">Payment</legend>
        {PAYMENT_METHODS.map((pm) => (
          <label
            key={pm.id}
            className={
              "flex cursor-pointer items-start gap-4 border p-4 transition-colors duration-300 " +
              (method === pm.id
                ? "border-champagne bg-ink-800"
                : "border-line hover:border-ivory-dim") +
              (pm.enabled ? "" : " pointer-events-none opacity-40")
            }
          >
            <input
              type="radio"
              name="paymentMethod"
              value={pm.id}
              checked={method === pm.id}
              onChange={() => pm.enabled && setMethod(pm.id)}
              disabled={!pm.enabled}
              className="mt-1 accent-champagne"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm text-ivory">{pm.label}</span>
              <span className="text-[0.8rem] leading-relaxed text-ivory-dim">
                {pm.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {formError ? (
        <div
          role="alert"
          className="border border-champagne/40 bg-ink-800 px-4 py-3 text-sm text-ivory-dim"
        >
          <p>{formError}</p>
          {unavailable.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-smoke">
              {unavailable.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          variant="solid"
          disabled={pending || items.length === 0}
          className="w-full"
        >
          {pending ? "Placing order…" : "Place order — cash on delivery"}
        </Button>
        <p className="text-[0.7rem] leading-relaxed text-smoke">
          By placing this order you agree to pay in cash on delivery. We&rsquo;ll
          call to confirm the address and timing.
        </p>
      </div>
    </form>
  );
}

function input(error?: string) {
  return (
    "h-12 w-full border bg-transparent px-3 text-sm text-ivory outline-none transition-colors duration-300 placeholder:text-smoke focus:border-champagne " +
    (error ? "border-champagne/70" : "border-line")
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
        <span>{label}</span>
        {hint ? <span className="normal-case tracking-normal">{hint}</span> : null}
      </span>
      {children}
      {error ? (
        <span className="text-[0.75rem] text-champagne-bright">{error}</span>
      ) : null}
    </label>
  );
}
