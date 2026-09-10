import Link from "next/link";
import { contentRepository } from "@/lib/content";

export default async function AdminOverviewPage() {
  const { settings, perfumes } = await contentRepository.getContent();
  const featured = perfumes.filter((p) => p.featured).length;
  const families = new Set(perfumes.map((p) => p.family)).size;

  const stats = [
    { label: "Fragrances", value: perfumes.length },
    { label: "Featured", value: featured },
    { label: "Families", value: families },
    { label: "Currency", value: settings.currency },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">Overview</span>
        <h1 className="font-serif text-3xl font-light text-ivory">
          {settings.brandName}
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-ivory-dim">
          A read-only snapshot of the content currently powering the storefront.
          Editing is wired up in a later phase; the screens and forms are here so
          the shape is settled.
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
          <h2 className="font-serif text-xl font-light text-ivory">Fragrances</h2>
          <Link
            href="/admin/fragrances"
            className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:text-champagne"
          >
            Manage
          </Link>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {perfumes.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-4">
              <div className="flex flex-col">
                <span className="text-sm text-ivory">{p.name}</span>
                <span className="text-xs text-smoke">
                  {p.family} &middot; {p.perfumer}
                </span>
              </div>
              <Link
                href={`/admin/fragrances/${p.id}`}
                className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:text-ivory"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
