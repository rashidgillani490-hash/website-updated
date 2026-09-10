import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an integer amount in the store's base currency. */
export function formatPrice(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format an ISO timestamp as e.g. "10 Sep 2026, 14:32". Empty string for a
 *  missing / unparseable value. */
export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Split long-form copy stored with blank-line paragraph breaks. */
export function toParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Split a single-field headline into display lines on newlines, trimming blanks.
 * Falls back to `fallback` when the value is empty. Used to feed editable
 * one-field copy (e.g. `SiteSettings.heroHeadline`) into components that render
 * a clipped line per array entry.
 */
export function splitLines(value: string | undefined | null, fallback: string) {
  const source = (value ?? "").trim() || fallback;
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
