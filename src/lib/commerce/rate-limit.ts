import "server-only";

import { createHash } from "node:crypto";
import type { OrderCustomerInput } from "./schema";
import type { OrderSummary } from "./types";

/**
 * In-process abuse protection for the anonymous COD checkout.
 *
 * This is a single-instance, in-memory guard: a sliding-window request limit
 * per client, an idempotency cache so a retried submission returns the first
 * result instead of creating a second order, and a short content-hash window so
 * an accidental double-submit is rejected. It needs no external service.
 *
 * What it is NOT: a distributed rate limiter. Each serverless instance keeps
 * its own maps, so a spread-out or multi-instance flood is only partly slowed.
 * A real defence (Upstash / Vercel KV counter, or Turnstile / hCaptcha on the
 * form) is infrastructure that is not configured here — see the phase notes.
 */

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const WINDOW_MS = intFromEnv("CHECKOUT_RATE_WINDOW_MS", 60_000);
const MAX_IN_WINDOW = intFromEnv("CHECKOUT_RATE_MAX", 6);
const IDEMPOTENCY_TTL_MS = 10 * 60_000;
const DEDUPE_TTL_MS = 30_000;
/** Hard cap so a flood of distinct keys can't grow the maps without bound. */
const MAX_KEYS = 5_000;

const attempts = new Map<string, number[]>();
const idempotent = new Map<string, { at: number; value: OrderSummary }>();
const recentIntents = new Map<string, number>();

function prune<T>(map: Map<string, T>, isExpired: (v: T) => boolean): void {
  for (const [k, v] of map) if (isExpired(v)) map.delete(k);
  if (map.size > MAX_KEYS) map.clear();
}

/**
 * Best-effort client identifier from proxy headers. Spoofable unless a trusted
 * proxy sets `x-forwarded-for`; requests with no usable IP share one bucket,
 * which still caps that whole class. The `Headers` is passed in so this module
 * stays free of `next/headers` (and unit-testable).
 */
export function clientKeyFromHeaders(h: Headers): string {
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "no-ip";
  return `checkout:${ip}`;
}

export interface RateDecision {
  ok: boolean;
  retryAfterMs: number;
}

export function checkRateLimit(key: string, now = Date.now()): RateDecision {
  prune(attempts, (ts) => ts.length === 0 || ts[ts.length - 1] < now - WINDOW_MS);

  const cutoff = now - WINDOW_MS;
  const recent = (attempts.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= MAX_IN_WINDOW) {
    const retryAfterMs = Math.max(0, recent[0] + WINDOW_MS - now);
    attempts.set(key, recent);
    return { ok: false, retryAfterMs };
  }

  recent.push(now);
  attempts.set(key, recent);
  return { ok: true, retryAfterMs: 0 };
}

/** Stable fingerprint of an order's intent (customer + lines), for dedupe. */
export function orderIntentHash(
  customer: OrderCustomerInput,
  items: Array<{ slug: string; ml: number; qty: number }>,
): string {
  const norm = {
    name: customer.name.trim().toLowerCase(),
    phone: customer.phone.replace(/\D/g, ""),
    address: customer.address.trim().toLowerCase(),
    city: customer.city.trim().toLowerCase(),
    items: [...items]
      .map((i) => `${i.slug}:${i.ml}:${i.qty}`)
      .sort(),
  };
  return createHash("sha256").update(JSON.stringify(norm)).digest("hex");
}

/** True (and records the hash) if an identical order was placed very recently. */
export function isDuplicateIntent(hash: string, now = Date.now()): boolean {
  prune(recentIntents, (at) => at < now - DEDUPE_TTL_MS);
  const seenAt = recentIntents.get(hash);
  if (seenAt && seenAt > now - DEDUPE_TTL_MS) return true;
  recentIntents.set(hash, now);
  return false;
}

/** Release a recorded intent so a legitimate retry isn't blocked (e.g. the
 *  write failed and no order was created). */
export function releaseIntent(hash: string): void {
  recentIntents.delete(hash);
}

export function getIdempotentResult(
  key: string,
  now = Date.now(),
): OrderSummary | undefined {
  prune(idempotent, (v) => v.at < now - IDEMPOTENCY_TTL_MS);
  const hit = idempotent.get(key);
  return hit && hit.at > now - IDEMPOTENCY_TTL_MS ? hit.value : undefined;
}

export function rememberIdempotentResult(
  key: string,
  value: OrderSummary,
  now = Date.now(),
): void {
  idempotent.set(key, { at: now, value });
}

/** Test-only: reset all in-memory state. */
export function __resetRateLimitState(): void {
  attempts.clear();
  idempotent.clear();
  recentIntents.clear();
}

export const RATE_LIMIT_CONFIG = {
  windowMs: WINDOW_MS,
  maxInWindow: MAX_IN_WINDOW,
  idempotencyTtlMs: IDEMPOTENCY_TTL_MS,
  dedupeTtlMs: DEDUPE_TTL_MS,
} as const;
