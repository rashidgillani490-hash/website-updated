import { describe, expect, it } from "vitest";
import { MockContentRepository } from "@/lib/content/mock-repository";
import { priceCart } from "./cart-store";
import { buildOrder, toOrderSummary } from "./orders";
import { placeOrderSchema } from "./schema";
import type { CartItem } from "./types";

/**
 * End-to-end of the checkout server path against the real sample catalogue —
 * the exact composition `placeOrder` performs (schema → re-price → buildOrder →
 * summary), minus the Next Server Action wrapper and the persist no-op.
 */
describe("checkout flow (mock catalogue)", () => {
  const repo = new MockContentRepository();

  const customer = {
    name: "Amélie Dubois",
    phone: "+1 415 555 0134",
    address: "9 Rue de Sévigné",
    city: "Paris",
  };

  it("prices a cash-on-delivery order from published data and redacts the summary", async () => {
    const payload = {
      customer,
      items: [
        { slug: "lumiere-noire", ml: 50, qty: 2, name: "Lumière Noire" },
        { slug: "bois-cendre", ml: 100, qty: 1, name: "Bois Cendré" },
      ],
      paymentMethod: "cod" as const,
    };

    const parsed = placeOrderSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const [catalogue, settings] = await Promise.all([
      repo.getPerfumes(),
      repo.getSettings(),
    ]);

    const stub: CartItem[] = parsed.data.items.map((l) => ({
      perfumeId: "",
      slug: l.slug,
      name: l.name ?? l.slug,
      concentration: "",
      ml: l.ml,
      unitPrice: 999, // tampered — must be ignored
      image: "",
      imageAlt: "",
      accent: "#c7ac7c",
      qty: l.qty,
    }));

    const priced = priceCart(stub, catalogue);
    expect(priced.unavailable).toEqual([]);
    // lumiere-noire 50ml = 245, bois-cendre 100ml = 265 (from perfumes.ts)
    expect(priced.subtotal).toBe(245 * 2 + 265);

    const order = buildOrder({
      customer: parsed.data.customer,
      items: priced.items,
      paymentMethod: parsed.data.paymentMethod,
      currency: settings.currency,
    });

    expect(order.status).toBe("pending");
    expect(order.total).toBe(755);
    expect(order.currency).toBe("USD");

    const summary = toOrderSummary(order);
    const json = JSON.stringify(summary);
    expect(json).not.toContain("Rue de Sévigné");
    expect(json).not.toContain("415 555");
    expect(summary).not.toHaveProperty("id");
    expect(summary.items).toHaveLength(2);
  });

  it("flags a line whose size no longer exists", async () => {
    const catalogue = await repo.getPerfumes();
    const stub: CartItem[] = [
      {
        perfumeId: "",
        slug: "lumiere-noire",
        name: "Lumière Noire",
        concentration: "",
        ml: 5, // no such size
        unitPrice: 10,
        image: "",
        imageAlt: "",
        accent: "#c7ac7c",
        qty: 1,
      },
    ];
    const priced = priceCart(stub, catalogue);
    expect(priced.items).toHaveLength(0);
    expect(priced.unavailable).toEqual(["Lumière Noire · 5 ml"]);
  });
});
