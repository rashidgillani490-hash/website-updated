import { describe, expect, it } from "vitest";
import { buildOrder, orderReference, toOrderSummary } from "./orders";
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
