import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { OrderAdmin } from "./orders";

/**
 * Minimal PostgREST stand-in. Every builder method returns the builder; the
 * builder is awaitable (list/affected-rows result) and `maybeSingle()` resolves
 * the single-row result. `head`/`count` selects resolve `{ count }`.
 */
function fakeDb(config: {
  list?: unknown[];
  single?: unknown;
  affected?: unknown[];
  count?: number;
  error?: unknown;
  rpc?: unknown;
  rpcError?: unknown;
}): SupabaseClient {
  const err = config.error ?? null;
  const client = {
    rpc: () =>
      Promise.resolve({
        data: config.rpc ?? null,
        error: config.rpcError ?? null,
      }),
    from() {
      const b: Record<string, unknown> = {};
      const chain = () => b;
      let mode: "list" | "affected" | "count" = "list";
      b.select = (_cols?: unknown, opts?: { head?: boolean }) => {
        if (opts?.head) mode = "count";
        return b;
      };
      b.update = () => {
        mode = "affected";
        return b;
      };
      b.eq = chain;
      b.order = chain;
      b.limit = chain;
      b.maybeSingle = () =>
        Promise.resolve({ data: config.single ?? null, error: err });
      b.then = (
        res: (v: unknown) => unknown,
        rej?: (r: unknown) => unknown,
      ) => {
        const value =
          mode === "count"
            ? { count: config.count ?? 0, error: err }
            : mode === "affected"
              ? { data: config.affected ?? [], error: err }
              : { data: config.list ?? [], error: err };
        return Promise.resolve(value).then(res, rej);
      };
      return b;
    },
  };
  return client as unknown as SupabaseClient;
}

const orderRow = {
  id: "11111111-1111-1111-1111-111111111111",
  reference: "ML-ABC234",
  status: "pending",
  payment_method: "cod",
  customer_name: "Amélie Dubois",
  customer_phone: "+1 415 555 0134",
  customer_email: null,
  address_line: "9 Rue de Sévigné",
  city: "Paris",
  notes: null,
  currency: "USD",
  subtotal: "490.00",
  total: "490.00",
  created_at: "2026-09-11T10:00:00Z",
  updated_at: "2026-09-11T10:00:00Z",
  order_items: [
    {
      id: "i1",
      perfume_id: "p1",
      slug: "lumiere-noire",
      name: "Lumière Noire",
      concentration: "Extrait de Parfum",
      ml: 50,
      unit_price: "245.00",
      qty: 2,
      line_total: "490.00",
    },
  ],
};

describe("OrderAdmin", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errSpy.mockRestore());

  it("get() maps a joined row to a clean AdminOrder", async () => {
    const repo = new OrderAdmin(fakeDb({ single: orderRow }));
    const order = await repo.get(orderRow.id);
    expect(order).not.toBeNull();
    expect(order!.reference).toBe("ML-ABC234");
    expect(order!.customer.phone).toBe("+1 415 555 0134");
    expect(order!.items).toHaveLength(1);
    expect(order!.items[0].lineTotal).toBe(490);
    expect(order!.total).toBe(490);
  });

  it("get() returns null when the row is missing", async () => {
    const repo = new OrderAdmin(fakeDb({ single: null }));
    expect(await repo.get("11111111-1111-1111-1111-111111111111")).toBeNull();
  });

  it("list() maps rows and applies the free-text filter in memory", async () => {
    const rows = [
      { ...orderRow, reference: "ML-AAA111", customer_name: "Amélie", order_items: [{ count: 1 }] },
      { ...orderRow, reference: "ML-BBB222", customer_name: "Jonas", city: "Oslo", order_items: [{ count: 2 }] },
    ];
    const repo = new OrderAdmin(fakeDb({ list: rows }));
    const all = await repo.list();
    expect(all).toHaveLength(2);
    expect(all[0].itemCount).toBe(1);

    const filtered = await repo.list({ q: "oslo" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].reference).toBe("ML-BBB222");
  });

  it("updateStatus() reports the transition returned by set_order_status", async () => {
    const repo = new OrderAdmin(
      fakeDb({ rpc: [{ changed: true, from_status: "pending", to_status: "confirmed" }] }),
    );
    const res = await repo.updateStatus(orderRow.id, "confirmed", {
      id: "actor-uuid",
      label: "admin@example.com",
    });
    expect(res).toEqual({
      ok: true,
      changed: true,
      from: "pending",
      to: "confirmed",
    });
  });

  it("updateStatus() reports changed:false for a no-op", async () => {
    const repo = new OrderAdmin(
      fakeDb({ rpc: [{ changed: false, from_status: "shipped", to_status: "shipped" }] }),
    );
    const res = await repo.updateStatus(orderRow.id, "shipped");
    expect(res).toEqual({ ok: true, changed: false, from: "shipped", to: "shipped" });
  });

  it("updateStatus() maps the RPC's order_not_found error", async () => {
    const repo = new OrderAdmin(fakeDb({ rpcError: { message: "order_not_found" } }));
    const res = await repo.updateStatus(orderRow.id, "confirmed");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/could not be found/i);
    expect(errSpy).toHaveBeenCalled();
  });

  it("updateStatus() returns a plain message (not the raw error) on an unexpected failure", async () => {
    const repo = new OrderAdmin(fakeDb({ rpcError: { message: "db exploded" } }));
    const res = await repo.updateStatus(orderRow.id, "shipped");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).not.toMatch(/db exploded/);
    expect(errSpy).toHaveBeenCalled();
  });

  it("history() maps rows oldest-first, initial row has from=null", async () => {
    const rows = [
      { from_status: null, to_status: "pending", actor_type: "system", actor_label: "checkout", note: null, created_at: "2026-09-11T10:00:00Z" },
      { from_status: "pending", to_status: "confirmed", actor_type: "admin", actor_label: "admin@example.com", note: null, created_at: "2026-09-11T11:00:00Z" },
    ];
    const repo = new OrderAdmin(fakeDb({ list: rows }));
    const h = await repo.history(orderRow.id);
    expect(h).toHaveLength(2);
    expect(h[0]).toMatchObject({ from: null, to: "pending", actorType: "system", actorLabel: "checkout" });
    expect(h[1]).toMatchObject({ from: "pending", to: "confirmed", actorLabel: "admin@example.com" });
  });

  it("counts() returns totals, and zeroes on error", async () => {
    expect(await new OrderAdmin(fakeDb({ count: 7 })).counts()).toEqual({
      total: 7,
      pending: 7,
    });
    expect(
      await new OrderAdmin(fakeDb({ error: { message: "x" } })).counts(),
    ).toEqual({ total: 0, pending: 0 });
  });
});
