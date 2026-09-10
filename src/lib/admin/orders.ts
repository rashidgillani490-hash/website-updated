import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus } from "@/lib/commerce/types";
import {
  filterOrders,
  toAdminOrder,
  toAdminOrderListItem,
  type AdminOrder,
  type AdminOrderListItem,
  type OrderItemRow,
  type OrderQuery,
  type OrderRow,
} from "./order-view";

export type WriteResult =
  | { ok: true }
  | { ok: false; error: string };

const LIST_SELECT =
  "id, reference, status, payment_method, customer_name, customer_phone, city, currency, total, created_at, order_items(count)";
const DETAIL_SELECT = "*, order_items(*)";
const DEFAULT_LIMIT = 200;

function logError(op: string, error: unknown): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  console.error(`[admin] OrderAdmin.${op} failed: ${message}`);
}

/**
 * Read + status-write surface for orders, bound to the signed-in admin's
 * session. Every query runs under the `is_admin()` RLS policies from
 * `20260910140000_orders.sql` / `20260910150000_order_status_workflow.sql`, so
 * a non-admin session sees nothing. Raw database errors are logged, never
 * returned to the browser.
 */
export class OrderAdmin {
  constructor(private readonly db: SupabaseClient) {}

  /** Recent orders, newest first, narrowed by status (DB) and free text (JS). */
  async list(query: OrderQuery = {}): Promise<AdminOrderListItem[]> {
    try {
      let q = this.db
        .from("orders")
        .select(LIST_SELECT)
        .order("created_at", { ascending: false })
        .limit(DEFAULT_LIMIT);

      if (query.status && query.status !== "all") {
        q = q.eq("status", query.status);
      }

      const { data, error } = await q;
      if (error) throw error;

      const items = ((data ?? []) as OrderRow[]).map(toAdminOrderListItem);
      // Free-text search is applied in memory — no user input ever reaches the
      // PostgREST filter string.
      return query.q ? filterOrders(items, { q: query.q }) : items;
    } catch (error) {
      logError("list", error);
      return [];
    }
  }

  async get(id: string): Promise<AdminOrder | null> {
    try {
      const { data, error } = await this.db
        .from("orders")
        .select(DETAIL_SELECT)
        .eq("id", id)
        .maybeSingle<OrderRow & { order_items: OrderItemRow[] | null }>();
      if (error) throw error;
      if (!data) return null;
      return toAdminOrder(data, data.order_items ?? []);
    } catch (error) {
      logError("get", error);
      return null;
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<WriteResult> {
    try {
      // `select` back the row so a no-op (unknown id, or RLS hiding it) is
      // reported instead of silently returning success.
      const { data, error } = await this.db
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        return { ok: false, error: "That order could not be found." };
      }
      return { ok: true };
    } catch (error) {
      logError("updateStatus", error);
      return { ok: false, error: "That status change didn't save. Please try again." };
    }
  }

  /** Small dashboard summary for the admin overview. */
  async counts(): Promise<{ total: number; pending: number }> {
    try {
      const [{ count: total }, { count: pending }] = await Promise.all([
        this.db.from("orders").select("id", { count: "exact", head: true }),
        this.db
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
      return { total: total ?? 0, pending: pending ?? 0 };
    } catch (error) {
      logError("counts", error);
      return { total: 0, pending: 0 };
    }
  }
}
