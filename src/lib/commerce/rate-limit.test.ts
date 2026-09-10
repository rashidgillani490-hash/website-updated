import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetRateLimitState,
  RATE_LIMIT_CONFIG,
  checkRateLimit,
  clientKeyFromHeaders,
  enforceCheckoutRate,
  getIdempotentResult,
  isDuplicateIntent,
  orderIntentHash,
  releaseIntent,
  rememberIdempotentResult,
} from "./rate-limit";
import type { OrderCustomerInput } from "./schema";
import type { OrderSummary } from "./types";

const customer: OrderCustomerInput = {
  name: "Amélie Dubois",
  phone: "+1 (415) 555-0134",
  email: undefined,
  address: "9 Rue de Sévigné",
  city: "Paris",
  notes: undefined,
};
const items = [{ slug: "lumiere-noire", ml: 50, qty: 2 }];

const summary: OrderSummary = {
  reference: "ML-ABC234",
  status: "pending",
  paymentMethod: "cod",
  items: [],
  currency: "USD",
  subtotal: 490,
  total: 490,
  customerName: "Amélie Dubois",
  city: "Paris",
};

beforeEach(() => __resetRateLimitState());

describe("clientKeyFromHeaders", () => {
  it("uses the first x-forwarded-for hop, then x-real-ip, then a shared bucket", () => {
    expect(
      clientKeyFromHeaders(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })),
    ).toBe("checkout:1.2.3.4");
    expect(clientKeyFromHeaders(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe(
      "checkout:5.6.7.8",
    );
    expect(clientKeyFromHeaders(new Headers())).toBe("checkout:no-ip");
  });
});

describe("checkRateLimit", () => {
  it("allows up to the max, then blocks with a retry hint", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxInWindow; i++) {
      expect(checkRateLimit("k", t0 + i).ok).toBe(true);
    }
    const blocked = checkRateLimit("k", t0 + RATE_LIMIT_CONFIG.maxInWindow);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(RATE_LIMIT_CONFIG.windowMs);
  });

  it("recovers once the window has passed", () => {
    const t0 = 2_000_000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxInWindow; i++) checkRateLimit("k", t0);
    expect(checkRateLimit("k", t0).ok).toBe(false);
    expect(checkRateLimit("k", t0 + RATE_LIMIT_CONFIG.windowMs + 1).ok).toBe(true);
  });

  it("keys are independent", () => {
    const t0 = 3_000_000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxInWindow; i++) checkRateLimit("a", t0);
    expect(checkRateLimit("a", t0).ok).toBe(false);
    expect(checkRateLimit("b", t0).ok).toBe(true);
  });
});

describe("enforceCheckoutRate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const withUpstash = () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://x.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "tok");
  };
  const fetchReturning = (counts: number[]) =>
    vi.fn(async () => ({
      ok: true,
      json: async () =>
        counts.flatMap((c) => [{ result: c }, { result: 1 }]),
    }));

  it("uses the in-process limiter when Upstash is not configured", async () => {
    const t0 = 5_000_000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxInWindow; i++) {
      expect((await enforceCheckoutRate("k", t0)).ok).toBe(true);
    }
    expect((await enforceCheckoutRate("k", t0)).ok).toBe(false);
  });

  it("allows when the distributed per-client + global counts are under the limits", async () => {
    withUpstash();
    vi.stubGlobal("fetch", fetchReturning([3, 10]));
    expect(await enforceCheckoutRate("checkout:1.2.3.4")).toEqual({
      ok: true,
      retryAfterMs: 0,
    });
  });

  it("blocks when the distributed per-client count exceeds the limit", async () => {
    withUpstash();
    vi.stubGlobal("fetch", fetchReturning([RATE_LIMIT_CONFIG.maxInWindow + 1, 5]));
    const res = await enforceCheckoutRate("checkout:1.2.3.4");
    expect(res.ok).toBe(false);
    expect(res.retryAfterMs).toBeGreaterThan(0);
  });

  it("blocks on the coarse global bucket even when a single client is fine", async () => {
    withUpstash();
    vi.stubGlobal("fetch", fetchReturning([1, RATE_LIMIT_CONFIG.globalMax + 1]));
    expect((await enforceCheckoutRate("checkout:9.9.9.9")).ok).toBe(false);
  });

  it("falls back to the in-process limiter if the Upstash call fails", async () => {
    withUpstash();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const t0 = 6_000_000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxInWindow; i++) {
      expect((await enforceCheckoutRate("k", t0)).ok).toBe(true);
    }
    expect((await enforceCheckoutRate("k", t0)).ok).toBe(false);
  });
});

describe("orderIntentHash / isDuplicateIntent", () => {
  it("is stable across formatting differences", () => {
    const a = orderIntentHash(customer, items);
    const b = orderIntentHash(
      { ...customer, name: "  amélie dubois ", phone: "1-415-555-0134" },
      [{ slug: "lumiere-noire", ml: 50, qty: 2 }],
    );
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs when an item changes", () => {
    expect(orderIntentHash(customer, items)).not.toBe(
      orderIntentHash(customer, [{ slug: "lumiere-noire", ml: 100, qty: 2 }]),
    );
  });

  it("flags a repeat within the dedupe window and clears on release", () => {
    const h = orderIntentHash(customer, items);
    const now = 10_000_000;
    expect(isDuplicateIntent(h, now)).toBe(false);
    expect(isDuplicateIntent(h, now + 1_000)).toBe(true);
    releaseIntent(h);
    expect(isDuplicateIntent(h, now + 2_000)).toBe(false);
  });

  it("stops flagging after the dedupe window", () => {
    const h = orderIntentHash(customer, items);
    expect(isDuplicateIntent(h, 20_000_000)).toBe(false);
    expect(
      isDuplicateIntent(h, 20_000_000 + RATE_LIMIT_CONFIG.dedupeTtlMs + 1),
    ).toBe(false);
  });
});

describe("idempotency cache", () => {
  it("returns the stored summary within TTL, nothing after", () => {
    const now = 30_000_000;
    expect(getIdempotentResult("key-1", now)).toBeUndefined();
    rememberIdempotentResult("key-1", summary, now);
    expect(getIdempotentResult("key-1", now + 1_000)?.reference).toBe("ML-ABC234");
    expect(
      getIdempotentResult("key-1", now + RATE_LIMIT_CONFIG.idempotencyTtlMs + 1),
    ).toBeUndefined();
  });
});
