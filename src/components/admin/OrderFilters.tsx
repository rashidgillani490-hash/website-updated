"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ORDER_STATUSES } from "@/lib/commerce/types";
import { ORDER_STATUS_META } from "@/lib/admin/order-view";

/**
 * Search box + status dropdown. Both write to the URL (`?q=&status=`); the page
 * is a Server Component that reads them back and re-queries.
 */
export function OrderFilters({
  initialQuery,
  initialStatus,
}: {
  initialQuery: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery);

  const push = (next: { q?: string; status?: string }) => {
    const sp = new URLSearchParams(params.toString());
    const nq = next.q ?? q;
    const ns = next.status ?? sp.get("status") ?? "all";
    if (nq.trim()) sp.set("q", nq.trim());
    else sp.delete("q");
    if (ns && ns !== "all") sp.set("status", ns);
    else sp.delete("status");
    router.push(sp.toString() ? `/admin/orders?${sp}` : "/admin/orders");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        push({});
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search reference, name, phone, city"
        aria-label="Search orders"
        className="h-10 w-full border border-line bg-ink-800 px-3 text-sm text-ivory placeholder:text-smoke focus:border-champagne focus:outline-none sm:max-w-xs"
      />
      <select
        aria-label="Filter by status"
        defaultValue={initialStatus || "all"}
        onChange={(e) => push({ status: e.target.value })}
        className="h-10 border border-line bg-ink-800 px-3 text-sm text-ivory focus:border-champagne focus:outline-none"
      >
        <option value="all">All statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_META[s].label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-10 border border-line px-4 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne"
      >
        Search
      </button>
    </form>
  );
}
