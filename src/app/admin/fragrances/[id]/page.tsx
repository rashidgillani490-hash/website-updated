import Link from "next/link";
import { notFound } from "next/navigation";
import { contentRepository } from "@/lib/content";
import { FragranceForm } from "@/components/admin/FragranceForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const perfumes = await contentRepository.getPerfumes();
  return perfumes.map((p) => ({ id: p.id }));
}

export default async function EditFragrancePage({ params }: PageProps) {
  const { id } = await params;
  const perfumes = await contentRepository.getPerfumes();
  const perfume = perfumes.find((p) => p.id === id);

  if (!perfume) notFound();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/fragrances"
          className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke transition-colors duration-300 hover:text-ivory"
        >
          ← Fragrances
        </Link>
        <h1 className="font-serif text-3xl font-light text-ivory">
          {perfume.name}
        </h1>
      </header>
      <FragranceForm perfume={perfume} />
    </div>
  );
}
