import type { Metadata } from "next";
import { contentRepository } from "@/lib/content";
import { splitLines } from "@/lib/utils";
import { baseOpenGraph } from "@/lib/seo";
import { CinematicPerfumeStory } from "@/components/home/CinematicPerfumeStory";
import { ScrollStory } from "@/components/home/ScrollStory";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { NotesPhilosophy } from "@/components/home/NotesPhilosophy";
import { Invitation } from "@/components/home/Invitation";

/** Serve statically; refresh content from the content source hourly. */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { settings, perfumes } = await contentRepository.getContent();
  const opener = perfumes.find((p) => p.featured) ?? perfumes[0];
  const title = `${settings.brandName} — ${settings.tagline}`;
  return {
    alternates: { canonical: "/" },
    openGraph: {
      ...baseOpenGraph(settings.brandName),
      title,
      description: settings.description,
      url: "/",
      images: opener
        ? [{ url: opener.hero.src, alt: opener.hero.alt || settings.brandName }]
        : undefined,
    },
  };
}

const STORY_STEPS = [
  {
    index: "01",
    title: "One accord at a time",
    body: "Each fragrance is built around a single idea and refuses to crowd it. Nothing is added that does not serve the centre.",
  },
  {
    index: "02",
    title: "Signed by the nose",
    body: "Every composition carries the name of the perfumer who made it. Three noses, six fragrances, no house style imposed from above.",
  },
  {
    index: "03",
    title: "Made in small batches",
    body: "We produce in quantities we can watch. Materials are bought whole, never to a price, and the formula does not change between runs.",
  },
  {
    index: "04",
    title: "Kept as it was",
    body: "No reformulation. When a material becomes hard to source we slow down rather than substitute. Some years there is simply less.",
  },
];

export default async function HomePage() {
  const { settings, perfumes } = await contentRepository.getContent();
  const featured = perfumes.filter((p) => p.featured);
  // May be undefined if the content source returns nothing (error / empty DB).
  const opener = featured[0] ?? perfumes[0];

  return (
    <>
      <CinematicPerfumeStory
        brandName={settings.brandName}
        eyebrow={settings.tagline}
        titleLines={splitLines(
          settings.heroHeadline,
          "The scent of\na room at dusk",
        )}
        intro={
          settings.heroIntro?.trim() ||
          "Maison Lumière is a small Parisian house making auteur perfumes — each one signed, made in limited batches, and left exactly as it was composed."
        }
        brandStory={
          settings.brandStory?.trim() ||
          settings.homepageIntro?.trim() ||
          settings.description
        }
        accent={opener?.accent ?? "#c7ac7c"}
        poster={opener?.hero.src ?? "/images/grain.svg"}
        posterAlt={opener?.hero.alt ?? settings.brandName}
      />

      <ScrollStory
        eyebrow="The house"
        heading="A small house, run deliberately slowly"
        intro={settings.homepageIntro?.trim() || undefined}
        steps={STORY_STEPS}
      />

      <FeaturedCollection
        perfumes={perfumes}
        currency={settings.currency}
        intro={settings.brandStory?.trim() || undefined}
      />

      <NotesPhilosophy />

      <Invitation email={settings.contactEmail} />
    </>
  );
}
