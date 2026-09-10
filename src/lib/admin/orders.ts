import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus } from "@/lib/commerce/types";
import {
  filterOrders,
  toAdminOrder,
  toAdminOrderListItem,
  toStatusHistoryEntry,
  type AdminOrder,
  type AdminOrderListItem,
  type OrderItemRow,
  type OrderQuery,
  type OrderRow,
  type StatusHistoryEntry,
  type StatusHistoryRow,
} from "./order-view";

export type WriteResult =
  | { ok: true }
  | { ok: false; error: string };

export interface StatusChangeResult {
  ok: true;
  /** false when the order was already in that status (no-op). */
  changed: boolean;
  from: OrderStatus;
  to: OrderStatus;
}
export type UpdateStatusResult = StatusChangeResult | { ok: false; error: string };

export interface StatusActor {
  id?: string;
  label?: string;
}

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

  /**
   * Move an order along its workflow via the `set_order_status` RPC — one
   * transaction that re-checks `is_admin()`, writes a tamper-resistant
   * `order_status_history` row (actor recorded), and returns stock when an
   * order is cancelled. See migration 20260910160000.
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    actor: StatusActor = {},
  ): Promise<UpdateStatusResult> {
    try {
      const { data, error } = await this.db.rpc("set_order_status", {
        p_order_id: id,
        p_status: status,
        p_actor_id: actor.id ?? null,
        p_actor_label: actor.label ?? null,
        p_note: null,
      });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        return { ok: false, error: "That status change didn't save. Please try again." };
      }
      return {
        ok: true,
        changed: Boolean(row.changed),
        from: row.from_status as OrderStatus,
        to: row.to_status as OrderStatus,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
            ? String((error as { message: unknown }).message)
            : String(error);
      logError("updateStatus", error);
      if (message.includes("order_not_found")) {
        return { ok: false, error: "That order could not be found." };
      }
      if (message.includes("invalid_status")) {
        return { ok: false, error: "Invalid status change." };
      }
      if (message.includes("not_authorized")) {
        return { ok: false, error: "Not authorised." };
      }
      return { ok: false, error: "That status change didn't save. Please try again." };
    }
  }

  /** The status trail for one order, oldest first. */
  async history(orderId: string): Promise<StatusHistoryEntry[]> {
    try {
      const { data, error } = await this.db
        .from("order_status_history")
        .select("from_status, to_status, actor_type, actor_label, note, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as StatusHistoryRow[]).map(toStatusHistoryEntry);
    } catch (error) {
      logError("history", error);
      return [];
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
