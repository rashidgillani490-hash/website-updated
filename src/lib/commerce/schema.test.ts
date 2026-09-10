import { describe, expect, it } from "vitest";
import { fieldErrors, placeOrderSchema } from "./schema";

const validPayload = {
  customer: {
    name: "Amélie Dubois",
    phone: "+1 (415) 555 0134",
    email: "amelie@example.com",
    address: "9 Rue de Sévigné",
    city: "Paris",
    notes: "Leave with the concierge.",
  },
  items: [{ slug: "lumiere-noire", ml: 50, qty: 2 }],
  paymentMethod: "cod" as const,
};

describe("placeOrderSchema", () => {
  it("accepts a well-formed COD order", () => {
    const parsed = placeOrderSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it("treats email and notes as optional", () => {
    const parsed = placeOrderSchema.safeParse({
      ...validPayload,
      customer: { ...validPayload.customer, email: "", notes: "" },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.customer.email).toBeUndefined();
      expect(parsed.data.customer.notes).toBeUndefined();
    }
  });

  it("rejects a missing name and a bad phone", () => {
    const parsed = placeOrderSchema.safeParse({
      ...validPayload,
      customer: { ...validPayload.customer, name: " ", phone: "call me" },
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      expect(errs["customer.name"]).toBeTruthy();
      expect(errs["customer.phone"]).toBeTruthy();
    }
  });

  it("rejects an invalid email when one is given", () => {
    const parsed = placeOrderSchema.safeParse({
      ...validPayload,
      customer: { ...validPayload.customer, email: "nope" },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an empty bag and an out-of-range quantity", () => {
    expect(
      placeOrderSchema.safeParse({ ...validPayload, items: [] }).success,
    ).toBe(false);
    expect(
      placeOrderSchema.safeParse({
        ...validPayload,
        items: [{ slug: "x", ml: 50, qty: 0 }],
      }).success,
    ).toBe(false);
    expect(
      placeOrderSchema.safeParse({
        ...validPayload,
        items: [{ slug: "x", ml: 50, qty: 100 }],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown payment method", () => {
    expect(
      placeOrderSchema.safeParse({ ...validPayload, paymentMethod: "card" })
        .success,
    ).toBe(false);
  });

  it("coerces numeric strings from form fields", () => {
    const parsed = placeOrderSchema.safeParse({
      ...validPayload,
      items: [{ slug: "lumiere-noire", ml: "50", qty: "3" }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items[0]).toEqual({
        slug: "lumiere-noire",
        ml: 50,
        qty: 3,
      });
    }
  });
});
