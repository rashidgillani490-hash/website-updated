import { beforeEach, describe, expect, it } from "vitest";
import { placeOrder } from "./actions";
import { __resetRateLimitState, RATE_LIMIT_CONFIG } from "@/lib/commerce/rate-limit";
import { __setHeaders } from "@/test/next-headers-stub";

/**
 * Integration coverage for the anonymous COD checkout action and its abuse
 * protections. Runs against MockContentRepository (no Supabase configured), so
 * `persistOrder` is a no-op and the checkout still completes end to end.
 */

const base = {
  customer: {
    name: "Amélie Dubois",
    phone: "+1 (415) 555-0134",
    address: "9 Rue de Sévigné",
    city: "Paris",
  },
  items: [{ slug: "lumiere-noire", ml: 50, qty: 2 }],
  paymentMethod: "cod" as const,
};

let ipCounter = 0;
/** Fresh IP per test so the sliding window starts clean. */
function freshClient() {
  __setHeaders({ "x-forwarded-for": `203.0.113.${ipCounter++}` });
}

beforeEach(() => {
  __resetRateLimitState();
  freshClient();
});

describe("placeOrder — happy path", () => {
  it("places a COD order and returns a redacted summary", async () => {
    const res = await placeOrder({ ...base, idempotencyKey: crypto.randomUUID() });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.summary.status).toBe("pending");
    expect(res.summary.paymentMethod).toBe("cod");
    expect(res.summary.total).toBe(490); // lumiere-noire 50ml = 245 * 2
    expect(res.summary.reference).toMatch(/^ML-/);
    expect(JSON.stringify(res.summary)).not.toContain("Rue de Sévigné");
    expect(JSON.stringify(res.summary)).not.toContain("555-0134");
  });
});

describe("placeOrder — input validation", () => {
  it("rejects a missing name / bad phone with field errors, no order", async () => {
    const res = await placeOrder({
      ...base,
      customer: { ...base.customer, name: " ", phone: "call me" },
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.fieldErrors?.["customer.name"]).toBeTruthy();
    expect(res.fieldErrors?.["customer.phone"]).toBeTruthy();
  });

  it("rejects a tampered oversized quantity", async () => {
    const res = await placeOrder({
      ...base,
      items: [{ slug: "lumiere-noire", ml: 50, qty: 9999 }],
    });
    expect(res.ok).toBe(false);
  });
});

describe("placeOrder — idempotency", () => {
  it("a retry with the same key returns the first order, not a new one", async () => {
    const idempotencyKey = crypto.randomUUID();
    const first = await placeOrder({ ...base, idempotencyKey });
    const second = await placeOrder({ ...base, idempotencyKey });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.summary.reference).toBe(first.summary.reference);
  });
});

describe("placeOrder — double-submit dedupe (no key)", () => {
  it("blocks an identical order submitted seconds apart", async () => {
    const first = await placeOrder(base);
    const second = await placeOrder(base);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toMatch(/just submitted/i);
  });
});

describe("placeOrder — rate limiting", () => {
  it("throttles once the per-client window is exhausted", async () => {
    __setHeaders({ "x-forwarded-for": "198.51.100.7" });
    // Distinct payloads so the dedupe backstop doesn't mask the rate limit.
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxInWindow; i++) {
      const r = await placeOrder({
        ...base,
        customer: { ...base.customer, city: `Paris ${i}` },
      });
      expect(r.ok).toBe(true);
    }
    const blocked = await placeOrder({
      ...base,
      customer: { ...base.customer, city: "Paris last" },
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
      expect(blocked.error).toMatch(/too many/i);
    }
  });
});
