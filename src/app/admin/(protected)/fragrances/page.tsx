import Link from "next/link";
import { getAdminRepo } from "@/lib/admin/context";
import { formatPrice } from "@/lib/utils";
import { PerfumeRowActions } from "@/components/admin/PerfumeRowActions";

export default async function AdminFragrancesPage() {
  const repo = await getAdminRepo();
  const [settings, perfumes] = await Promise.all([
    repo.getSettings(),
    repo.getPerfumes(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">Perfumes</span>
          <h1 className="font-serif text-3xl font-light text-ivory">
            {perfumes.length} in the catalogue
          </h1>
        </div>
        <Link
          href="/admin/fragrances/new"
          className="h-11 shrink-0 border border-line px-5 text-[0.65rem] font-medium uppercase leading-[2.75rem] tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne"
        >
          Add perfume
        </Link>
      </header>

      {perfumes.length === 0 ? (
        <p className="border border-line bg-ink-800 p-6 text-sm text-ivory-dim">
          No perfumes yet.{" "}
          <Link href="/admin/fragrances/new" className="text-champagne">
            Add the first one
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {perfumes.map((p, i) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 py-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex flex-col gap-1">
                <Link
                  href={`/admin/fragrances/${p.id}`}
                  className="text-sm text-ivory transition-colors duration-300 hover:text-champagne"
                >
                  {p.name}
                </Link>
                <span className="text-xs text-smoke">
                  {p.family} &middot; {p.perfumer || "—"} &middot; from{" "}
                  {p.sizes.length
                    ? formatPrice(
                        Math.min(...p.sizes.map((s) => s.price)),
                        settings.currency,
                      )
                    : "—"}{" "}
                  &middot; /{p.slug}
                </span>
              </div>
              <PerfumeRowActions
                id={p.id}
                name={p.name}
                featured={p.featured}
                isPublished={p.isPublished ?? true}
                availability={p.availability ?? "available"}
                order={p.order}
                isFirst={i === 0}
                isLast={i === perfumes.length - 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
