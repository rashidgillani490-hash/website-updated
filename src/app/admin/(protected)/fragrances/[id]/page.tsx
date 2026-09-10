import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRepo } from "@/lib/admin/context";
import { FragranceForm } from "@/components/admin/FragranceForm";
import { FormSection } from "@/components/admin/AdminForm";
import { PerfumeImages } from "@/components/admin/PerfumeImages";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFragrancePage({ params }: PageProps) {
  const { id } = await params;
  const repo = await getAdminRepo();
  const [perfume, images] = await Promise.all([
    repo.getPerfumeById(id),
    repo.getPerfumeImages(id),
  ]);

  if (!perfume) notFound();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/fragrances"
          className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke transition-colors duration-300 hover:text-ivory"
        >
          ← Perfumes
        </Link>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-serif text-3xl font-light text-ivory">
            {perfume.name}
          </h1>
          {perfume.isPublished ? null : (
            <span className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
              Draft
            </span>
          )}
          <Link
            href={`/fragrance/${perfume.slug}`}
            className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:text-champagne"
          >
            View on site ↗
          </Link>
        </div>
      </header>

      <FragranceForm perfume={perfume} />

      <div className="flex flex-col">
        <FormSection
          title="Images"
          description="Hero and gallery photography. Uploads go straight to storage; changes here save on their own."
        >
          <PerfumeImages
            perfumeId={perfume.id}
            slug={perfume.slug}
            images={images}
          />
        </FormSection>
      </div>
    </div>
  );
}
