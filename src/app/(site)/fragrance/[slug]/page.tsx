import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { contentRepository } from "@/lib/content";
import { toParagraphs } from "@/lib/utils";
import { baseOpenGraph } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { PerfumeDetail } from "@/components/perfume/PerfumeDetail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Serve statically; refresh from the content source hourly. A slug added
 *  after build renders on demand (dynamicParams defaults to true). */
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await contentRepository.getAllPerfumeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [perfume, settings] = await Promise.all([
    contentRepository.getPerfumeBySlug(slug),
    contentRepository.getSettings(),
  ]);
  // The page 404s below; `app/not-found.tsx` supplies the noindex metadata.
  if (!perfume) return {};

  const description =
    perfume.tagline?.trim() ||
    toParagraphs(perfume.description)[0] ||
    `${perfume.name} by ${settings.brandName}.`;
  const canonical = `/fragrance/${perfume.slug}`;
  const image = { url: perfume.hero.src, alt: perfume.hero.alt || perfume.name };

  return {
    title: perfume.name,
    description,
    alternates: { canonical },
    openGraph: {
      ...baseOpenGraph(settings.brandName),
      title: `${perfume.name} — ${settings.brandName}`,
      description,
      url: canonical,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${perfume.name} — ${settings.brandName}`,
      description,
      images: [image.url],
    },
  };
}

export default async function FragrancePage({ params }: PageProps) {
  const { slug } = await params;
  const [perfume, settings] = await Promise.all([
    contentRepository.getPerfumeBySlug(slug),
    contentRepository.getSettings(),
  ]);

  if (!perfume) notFound();

  return (
    <div>
      <Container bleed className="pt-10">
        <Link
          href="/collection"
          className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke transition-colors duration-500 hover:text-ivory"
        >
          <span aria-hidden className="h-px w-6 bg-current" />
          Back to collection
        </Link>
      </Container>
      <PerfumeDetail perfume={perfume} settings={settings} />
    </div>
  );
}
