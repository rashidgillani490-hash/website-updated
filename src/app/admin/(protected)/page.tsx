import Link from "next/link";
import { getAdminRepo, getOrderAdmin } from "@/lib/admin/context";

export default async function AdminOverviewPage() {
  const [repo, orders] = await Promise.all([getAdminRepo(), getOrderAdmin()]);
  const [settings, perfumes, orderCounts] = await Promise.all([
    repo.getSettings(),
    repo.getPerfumes(),
    orders.counts(),
  ]);

  const featured = perfumes.filter((p) => p.featured).length;

  const stats = [
    { label: "Fragrances", value: perfumes.length },
    { label: "Featured", value: featured },
    { label: "Orders", value: orderCounts.total },
    { label: "Pending", value: orderCounts.pending },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">Overview</span>
        <h1 className="font-serif text-3xl font-light text-ivory">
          {settings.brandName}
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-ivory-dim">
          Edit the website settings and the perfume catalogue. Changes publish to
          the storefront as soon as they save.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-ink-800 p-6">
            <div className="font-serif text-3xl font-light text-ivory">
              {stat.value}
            </div>
            <div className="mt-2 text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-light text-ivory">Quick links</h2>
        </div>
        <ul className="divide-y divide-line border-y border-line text-sm">
          <li className="py-4">
            <Link
              href="/admin/orders"
              className="text-ivory-dim transition-colors duration-300 hover:text-champagne"
            >
              Review orders
              {orderCounts.pending > 0 ? ` (${orderCounts.pending} pending)` : ""} →
            </Link>
          </li>
          <li className="py-4">
            <Link
              href="/admin/settings"
              className="text-ivory-dim transition-colors duration-300 hover:text-champagne"
            >
              Edit website settings →
            </Link>
          </li>
          <li className="py-4">
            <Link
              href="/admin/fragrances"
              className="text-ivory-dim transition-colors duration-300 hover:text-champagne"
            >
              Manage perfumes →
            </Link>
          </li>
          <li className="py-4">
            <Link
              href="/admin/fragrances/new"
              className="text-ivory-dim transition-colors duration-300 hover:text-champagne"
            >
              Add a perfume →
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
