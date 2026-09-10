import type { Metadata } from "next";
import { contentRepository } from "@/lib/content";
import { baseOpenGraph } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { PerfumeCollection } from "@/components/perfume/PerfumeCollection";

/** Serve statically; refresh the catalogue from the content source hourly. */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { settings, perfumes } = await contentRepository.getContent();
  const description = `The full ${settings.brandName} collection — ${perfumes.length} auteur fragrances, each signed by its perfumer and made in limited batches.`;
  const opener = perfumes.find((p) => p.featured) ?? perfumes[0];
  return {
    title: "Collection",
    description,
    alternates: { canonical: "/collection" },
    openGraph: {
      ...baseOpenGraph(settings.brandName),
      title: `Collection — ${settings.brandName}`,
      description,
      url: "/collection",
      images: opener
        ? [{ url: opener.hero.src, alt: opener.hero.alt || settings.brandName }]
        : undefined,
    },
  };
}

export default async function CollectionPage() {
  const { settings, perfumes } = await contentRepository.getContent();

  return (
    <div className="pb-32 pt-16 md:pt-24">
      <Container>
        <header className="flex flex-col gap-6">
          <Reveal>
            <span className="eyebrow flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-champagne/60" />
              The collection
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="max-w-2xl font-serif text-[clamp(2.5rem,6vw,4.25rem)] font-light leading-[1] text-ivory">
              Everything we make
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-xl text-[0.98rem] leading-relaxed text-ivory-dim">
              {perfumes.length} fragrances, listed as they were composed. Prices
              shown are the smallest size; each is also offered larger.
            </p>
          </Reveal>
        </header>

        <div className="mt-8 h-px w-full bg-line" />

        <div className="mt-16">
          <PerfumeCollection perfumes={perfumes} currency={settings.currency} />
        </div>
      </Container>
    </div>
  );
}
