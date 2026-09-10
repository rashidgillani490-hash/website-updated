import "server-only";

import { createHash } from "node:crypto";
import type { OrderCustomerInput } from "./schema";
import type { OrderSummary } from "./types";

/**
 * Abuse protection for the anonymous COD checkout.
 *
 * Two layers:
 *   - Always: an in-process sliding-window limit per client, an idempotency
 *     cache, and a short content-hash dedupe window. No external service.
 *   - When `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set: a
 *     distributed fixed-window counter (per client IP + a coarse global bucket)
 *     via the Upstash REST API — one `INCR` per request, shared across every
 *     serverless instance. `enforceCheckoutRate()` uses it and falls back to
 *     the in-process check if the backend is slow or unavailable, so a KV
 *     outage cannot take checkout down.
 *
 * If Upstash is not configured the limiter is single-instance only: a flood
 * spread across instances / IPs is only partly slowed. That gap is
 * infrastructure-dependent (provision Upstash, or add Turnstile to the form).
 */

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const WINDOW_MS = intFromEnv("CHECKOUT_RATE_WINDOW_MS", 60_000);
const MAX_IN_WINDOW = intFromEnv("CHECKOUT_RATE_MAX", 6);
/** Coarse ceiling on total checkout attempts per window (distributed only) —
 *  catches a flood spread across many IPs. */
const GLOBAL_MAX = intFromEnv("CHECKOUT_RATE_GLOBAL_MAX", MAX_IN_WINDOW * 50);
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

/* ------------------------------------------------- distributed (Upstash REST) */

function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

let upstashWarned = false;

/**
 * One atomic fixed-window `INCR` per bucket via Upstash's pipeline endpoint.
 * Returns the resulting counts, or `null` if the backend is unreachable / slow
 * (the caller then falls back to the in-process check).
 */
async function upstashIncr(
  cfg: { url: string; token: string },
  bucketKeys: string[],
  windowStart: number,
): Promise<number[] | null> {
  const pipeline = bucketKeys.flatMap((k) => {
    const key = `chk:${k}:${windowStart}`;
    return [
      ["INCR", key],
      ["PEXPIRE", key, String(WINDOW_MS + 5_000), "NX"],
    ];
  });

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 600);
  try {
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      signal: ac.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    const body = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    // Every other entry is an INCR result.
    return bucketKeys.map((_, i) => Number(body[i * 2]?.result ?? 0));
  } catch (error) {
    if (!upstashWarned) {
      upstashWarned = true;
      console.warn(
        `[rate-limit] Upstash unavailable — falling back to the in-process limiter. (${
          error instanceof Error ? error.message : String(error)
        })`,
      );
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The check the checkout Server Action calls. Distributed when Upstash is
 * configured (per-client + global buckets), in-process otherwise, and always
 * in-process if the distributed backend fails.
 */
export async function enforceCheckoutRate(
  key: string,
  now = Date.now(),
): Promise<RateDecision> {
  const cfg = upstashConfig();
  if (!cfg) return checkRateLimit(key, now);

  const windowStart = Math.floor(now / WINDOW_MS);
  const counts = await upstashIncr(cfg, [key, "__all__"], windowStart);
  if (!counts) return checkRateLimit(key, now);

  const [perClient, global] = counts;
  const retryAfterMs = Math.max(1, (windowStart + 1) * WINDOW_MS - now);

  if (perClient > MAX_IN_WINDOW) return { ok: false, retryAfterMs };
  if (global > GLOBAL_MAX) return { ok: false, retryAfterMs };
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
  upstashWarned = false;
}

export const RATE_LIMIT_CONFIG = {
  windowMs: WINDOW_MS,
  maxInWindow: MAX_IN_WINDOW,
  globalMax: GLOBAL_MAX,
  idempotencyTtlMs: IDEMPOTENCY_TTL_MS,
  dedupeTtlMs: DEDUPE_TTL_MS,
  distributed: Boolean(upstashConfig()),
} as const;
