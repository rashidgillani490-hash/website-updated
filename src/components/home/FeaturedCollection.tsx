import type { Perfume } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PerfumeCollection } from "@/components/perfume/PerfumeCollection";

interface FeaturedCollectionProps {
  perfumes: Perfume[];
  currency: string;
  /** Editable brand story; falls back to the built-in line when absent. */
  intro?: string;
}

export function FeaturedCollection({
  perfumes,
  currency,
  intro,
}: FeaturedCollectionProps) {
  return (
    <section className="bg-ink py-28 md:py-36">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="The collection"
            title="Each one signed"
            intro={
              intro ||
              "Small batches, no reformulation. Every bottle carries the name of the perfumer who composed it."
            }
          />
          <Reveal>
            <ButtonLink href="/collection" variant="outline" className="shrink-0">
              View all
            </ButtonLink>
          </Reveal>
        </div>

        <div className="mt-16">
          <PerfumeCollection perfumes={perfumes} currency={currency} />
        </div>
      </Container>
    </section>
  );
}
