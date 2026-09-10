import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildOrder, orderReference, persistOrder, toOrderSummary } from "./orders";
import type { OrderItem } from "./types";

const items: OrderItem[] = [
  {
    perfumeId: "prf_noire",
    slug: "lumiere-noire",
    name: "Lumière Noire",
    concentration: "Extrait de Parfum",
    ml: 50,
    unitPrice: 245,
    qty: 2,
    lineTotal: 490,
  },
  {
    perfumeId: "prf_bois",
    slug: "bois-cendre",
    name: "Bois Cendré",
    concentration: "Eau de Parfum",
    ml: 100,
    unitPrice: 265,
    qty: 1,
    lineTotal: 265,
  },
];

describe("orderReference", () => {
  it("is ML- plus 6 unambiguous chars", () => {
    for (let i = 0; i < 50; i++) {
      expect(orderReference()).toMatch(/^ML-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });
});

describe("buildOrder", () => {
  const order = buildOrder({
    customer: {
      name: "A. Dubois",
      phone: "+1 415 555 0134",
      address: "9 Rue de Sévigné",
      city: "Paris",
    },
    items,
    paymentMethod: "cod",
    currency: "USD",
  });

  it("defaults status to pending and stamps timestamps", () => {
    expect(order.status).toBe("pending");
    expect(order.paymentMethod).toBe("cod");
    expect(() => new Date(order.createdAt).toISOString()).not.toThrow();
    expect(order.createdAt).toBe(order.updatedAt);
  });

  it("sums subtotal and total from the line totals", () => {
    expect(order.subtotal).toBe(755);
    expect(order.total).toBe(755);
  });

  it("carries an id, a reference and the currency", () => {
    expect(order.id).toBeTruthy();
    expect(order.reference).toMatch(/^ML-/);
    expect(order.currency).toBe("USD");
  });
});

describe("persistOrder — not configured", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Force "Supabase not configured".
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  });
  afterEach(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  const order = buildOrder({
    customer: {
      name: "A. Dubois",
      phone: "+1 415 555 0134",
      address: "9 Rue de Sévigné",
      city: "Paris",
    },
    items,
    paymentMethod: "cod",
    currency: "USD",
  });

  it("REFUSES the order in production (no fake success)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = await persistOrder(order);
    expect(result).toEqual({ ok: false });
    expect(errorSpy).toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("allows the flow to complete in dev / test (no persistence)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = await persistOrder(order);
    expect(result).toEqual({ ok: true });
    expect(infoSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("persistOrder — via place_order RPC (injected client)", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  const order = buildOrder({
    customer: {
      name: "A. Dubois",
      phone: "+1 415 555 0134",
      address: "9 Rue de Sévigné",
      city: "Paris",
    },
    items,
    paymentMethod: "cod",
    currency: "USD",
  });

  const fakeClient = (rpcResult: { data?: unknown; error?: unknown }) =>
    ({
      rpc: (name: string, args: unknown) => {
        rpcSpy(name, args);
        return Promise.resolve({
          data: rpcResult.data ?? null,
          error: rpcResult.error ?? null,
        });
      },
    }) as unknown as import("@supabase/supabase-js").SupabaseClient;

  let rpcSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    rpcSpy = vi.fn();
  });

  it("calls place_order with server-authoritative items and succeeds", async () => {
    const result = await persistOrder(
      order,
      fakeClient({ data: [{ order_id: "x", order_reference: order.reference }] }),
    );
    expect(result).toEqual({ ok: true });
    expect(rpcSpy).toHaveBeenCalledWith(
      "place_order",
      expect.objectContaining({
        p_reference: order.reference,
        p_currency: "USD",
        p_items: expect.arrayContaining([
          expect.objectContaining({ slug: "lumiere-noire", ml: 50, qty: 2 }),
        ]),
      }),
    );
  });

  it("reports out-of-stock slugs from an insufficient_stock error", async () => {
    const result = await persistOrder(
      order,
      fakeClient({ error: { message: "insufficient_stock:lumiere-noire" } }),
    );
    expect(result).toEqual({ ok: false, outOfStock: ["lumiere-noire"] });
    expect(errorSpy).not.toHaveBeenCalled(); // handled, not an unexpected failure
  });

  it("returns { ok: false } (no PII) on any other RPC error", async () => {
    const result = await persistOrder(
      order,
      fakeClient({ error: { message: "boom", code: "XX000" } }),
    );
    expect(result).toEqual({ ok: false });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/persistOrder .* failed \(code XX000\)/),
    );
  });
});

describe("toOrderSummary", () => {
  it("drops the id and raw customer data, keeps the safe view", () => {
    const order = buildOrder({
      customer: {
        name: "A. Dubois",
        phone: "+1 415 555 0134",
        email: "a@example.com",
        address: "9 Rue de Sévigné",
        city: "Paris",
        notes: "secret",
      },
      items,
      paymentMethod: "cod",
      currency: "USD",
    });
    const summary = toOrderSummary(order);

    expect(summary).not.toHaveProperty("id");
    expect(summary).not.toHaveProperty("customer");
    expect(JSON.stringify(summary)).not.toContain("Rue de Sévigné");
    expect(JSON.stringify(summary)).not.toContain("415 555");
    expect(JSON.stringify(summary)).not.toContain("secret");
    expect(summary.customerName).toBe("A. Dubois");
    expect(summary.city).toBe("Paris");
    expect(summary.reference).toBe(order.reference);
    expect(summary.items).toHaveLength(2);
    expect(summary.total).toBe(755);
  });
});
