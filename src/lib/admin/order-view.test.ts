import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "@/lib/commerce/types";
import {
  ORDER_STATUS_META,
  filterOrders,
  isOrderStatus,
  matchesQuery,
  paymentLabel,
  toAdminOrder,
  toAdminOrderListItem,
  type AdminOrderListItem,
  type OrderItemRow,
  type OrderRow,
} from "./order-view";

const row: OrderRow = {
  id: "11111111-1111-1111-1111-111111111111",
  reference: "ML-ABC234",
  status: "confirmed",
  payment_method: "cod",
  customer_name: "Amélie Dubois",
  customer_phone: "+1 415 555 0134",
  customer_email: "amelie@example.com",
  address_line: "9 Rue de Sévigné",
  city: "Paris",
  notes: "Concierge.",
  currency: "USD",
  subtotal: "755.00",
  total: "755.00",
  created_at: "2026-09-10T12:00:00.000Z",
  updated_at: "2026-09-10T12:30:00.000Z",
  order_items: [{ count: 3 }],
};

const itemRows: OrderItemRow[] = [
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
  {
    id: "i2",
    perfume_id: "p2",
    slug: "bois-cendre",
    name: "Bois Cendré",
    concentration: "Eau de Parfum",
    ml: 100,
    unit_price: "265.00",
    qty: 1,
    line_total: "265.00",
  },
];

describe("status metadata", () => {
  it("covers all six statuses and no extras", () => {
    expect(Object.keys(ORDER_STATUS_META).sort()).toEqual(
      [...ORDER_STATUSES].sort(),
    );
    expect(ORDER_STATUSES).toEqual([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]);
  });

  it("isOrderStatus guards unknown values", () => {
    expect(isOrderStatus("shipped")).toBe(true);
    expect(isOrderStatus("fulfilled")).toBe(false);
    expect(isOrderStatus(3)).toBe(false);
  });

  it("paymentLabel maps cod, passes others through", () => {
    expect(paymentLabel("cod")).toBe("Cash on delivery");
    expect(paymentLabel("wire")).toBe("wire");
  });
});

describe("toAdminOrderListItem", () => {
  it("maps a row + item-count aggregate to a clean list item", () => {
    const item = toAdminOrderListItem(row);
    expect(item).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      reference: "ML-ABC234",
      status: "confirmed",
      paymentMethod: "cod",
      customerName: "Amélie Dubois",
      customerPhone: "+1 415 555 0134",
      city: "Paris",
      currency: "USD",
      total: 755,
      itemCount: 3,
      createdAt: "2026-09-10T12:00:00.000Z",
    });
  });

  it("falls back to pending for an unknown status and 0 for a missing count", () => {
    const item = toAdminOrderListItem({
      ...row,
      status: "weird",
      order_items: null,
    });
    expect(item.status).toBe("pending");
    expect(item.itemCount).toBe(0);
  });
});

describe("toAdminOrder", () => {
  it("maps customer data, items and money with no snake_case leaking", () => {
    const order = toAdminOrder(row, itemRows);
    expect(order.customer).toEqual({
      name: "Amélie Dubois",
      phone: "+1 415 555 0134",
      email: "amelie@example.com",
      address: "9 Rue de Sévigné",
      city: "Paris",
      notes: "Concierge.",
    });
    expect(order.items).toHaveLength(2);
    expect(order.items[0]).toEqual({
      name: "Lumière Noire",
      concentration: "Extrait de Parfum",
      ml: 50,
      qty: 2,
      unitPrice: 245,
      lineTotal: 490,
    });
    expect(order.subtotal).toBe(755);
    expect(order.total).toBe(755);
    expect(Object.keys(order)).not.toContain("customer_name");
    expect(Object.keys(order)).not.toContain("order_items");
  });

  it("tolerates a null item list", () => {
    const order = toAdminOrder(row, null as unknown as OrderItemRow[]);
    expect(order.items).toEqual([]);
  });
});

describe("filterOrders / matchesQuery", () => {
  const list: AdminOrderListItem[] = [
    {
      id: "1",
      reference: "ML-AAA111",
      status: "pending",
      paymentMethod: "cod",
      customerName: "Amélie Dubois",
      customerPhone: "+1 415 555 0134",
      city: "Paris",
      currency: "USD",
      total: 245,
      itemCount: 1,
      createdAt: "2026-09-10T10:00:00Z",
    },
    {
      id: "2",
      reference: "ML-BBB222",
      status: "shipped",
      paymentMethod: "cod",
      customerName: "Jonas Berg",
      customerPhone: "+46 70 555 22",
      city: "Stockholm",
      currency: "USD",
      total: 610,
      itemCount: 2,
      createdAt: "2026-09-09T10:00:00Z",
    },
  ];

  it("matches on reference, name, phone or city, case-insensitively", () => {
    expect(matchesQuery(list[0], "bbb")).toBe(false);
    expect(matchesQuery(list[0], "amélie")).toBe(true);
    expect(matchesQuery(list[0], "PARIS")).toBe(true);
    expect(matchesQuery(list[1], "555 22")).toBe(true);
    expect(matchesQuery(list[0], "")).toBe(true);
  });

  it("filters by status and query together", () => {
    expect(filterOrders(list, { status: "all" })).toHaveLength(2);
    expect(filterOrders(list, { status: "shipped" })).toEqual([list[1]]);
    expect(filterOrders(list, { q: "stockholm" })).toEqual([list[1]]);
    expect(filterOrders(list, { status: "pending", q: "berg" })).toEqual([]);
  });
});
