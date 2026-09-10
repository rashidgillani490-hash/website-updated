import type { Perfume } from "@/lib/content";
import { PerfumeCard } from "./PerfumeCard";

interface PerfumeCollectionProps {
  perfumes: Perfume[];
  currency: string;
  columns?: 2 | 3;
}

/** Responsive catalogue grid. Used on the home preview and the collection page. */
export function PerfumeCollection({
  perfumes,
  currency,
  columns = 3,
}: PerfumeCollectionProps) {
  return (
    <div
      className={
        columns === 3
          ? "grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
          : "grid gap-x-8 gap-y-14 sm:grid-cols-2"
      }
    >
      {perfumes.map((perfume, i) => (
        <PerfumeCard
          key={perfume.id}
          perfume={perfume}
          currency={currency}
          index={i}
        />
      ))}
    </div>
  );
}
