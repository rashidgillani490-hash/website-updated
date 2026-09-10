import Link from "next/link";
import { contentRepository } from "@/lib/content";
import { formatPrice } from "@/lib/utils";

export default async function AdminFragrancesPage() {
  const { settings, perfumes } = await contentRepository.getContent();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">Fragrances</span>
          <h1 className="font-serif text-3xl font-light text-ivory">
            {perfumes.length} in the collection
          </h1>
        </div>
        <Link
          href="/admin/fragrances/new"
          className="h-11 shrink-0 border border-line px-5 text-[0.65rem] font-medium uppercase leading-[2.75rem] tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne"
        >
          New fragrance
        </Link>
      </header>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Family</th>
              <th className="px-4 py-3 font-medium">Perfumer</th>
              <th className="px-4 py-3 font-medium">From</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {perfumes.map((p) => (
              <tr key={p.id} className="text-ivory-dim">
                <td className="px-4 py-4 text-ivory">{p.name}</td>
                <td className="px-4 py-4">{p.family}</td>
                <td className="px-4 py-4">{p.perfumer}</td>
                <td className="px-4 py-4">
                  {formatPrice(
                    Math.min(...p.sizes.map((s) => s.price)),
                    settings.currency,
                  )}
                </td>
                <td className="px-4 py-4">{p.featured ? "Yes" : "—"}</td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/admin/fragrances/${p.id}`}
                    className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] transition-colors duration-300 hover:text-champagne"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
