import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyOrderCancelled } from "./notifications";
import type { AdminOrder } from "@/lib/admin/order-view";

const order: AdminOrder = {
  id: "11111111-1111-1111-1111-111111111111",
  reference: "ML-ABC234",
  status: "cancelled",
  paymentMethod: "cod",
  customer: {
    name: "Amélie Dubois",
    phone: "+1 415 555 0134",
    email: "amelie@example.com",
    address: "9 Rue de Sévigné",
    city: "Paris",
    notes: "Concierge.",
  },
  items: [
    { name: "Lumière Noire", concentration: "Extrait", ml: 50, qty: 2, unitPrice: 245, lineTotal: 490 },
  ],
  currency: "USD",
  subtotal: 490,
  total: 490,
  createdAt: "2026-09-11T10:00:00Z",
  updatedAt: "2026-09-11T12:00:00Z",
};

describe("notifyOrderCancelled", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => infoSpy.mockRestore());

  it("logs the reference, totals and city — and NO name / phone / email / address", async () => {
    await notifyOrderCancelled(order);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const line = String(infoSpy.mock.calls[0][0]);

    expect(line).toContain("ML-ABC234");
    expect(line).toContain("Paris");
    expect(line).toContain("USD 490");
    expect(line).toMatch(/contact on file: yes/);

    expect(line).not.toContain("Amélie Dubois");
    expect(line).not.toContain("415 555 0134");
    expect(line).not.toContain("amelie@example.com");
    expect(line).not.toContain("Rue de Sévigné");
    expect(line).not.toContain("Concierge");
  });

  it("reports 'no' contact when neither email nor phone is present", async () => {
    await notifyOrderCancelled({
      ...order,
      customer: { ...order.customer, email: "", phone: "" },
    });
    expect(String(infoSpy.mock.calls[0][0])).toMatch(/contact on file: no/);
  });
});
