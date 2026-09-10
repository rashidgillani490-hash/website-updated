"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useScroll } from "motion/react";
import type { Perfume, SiteSettings } from "@/lib/content";
import { PerfumeExperience } from "@/components/three/PerfumeExperience";
import { FragranceNotes } from "./FragranceNotes";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatPrice, toParagraphs } from "@/lib/utils";

interface PerfumeDetailProps {
  perfume: Perfume;
  settings: SiteSettings;
}

export function PerfumeDetail({ perfume, settings }: PerfumeDetailProps) {
  const [sizeIndex, setSizeIndex] = useState(0);
  const size = perfume.sizes[sizeIndex];
  const paragraphs = toParagraphs(perfume.description);

  // Same reusable animation system as the homepage story, in "showcase" mode:
  // the selected perfume's flacon turns with scroll while its panel is in view.
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end start"],
  });

  return (
    <div className="pb-32">
      {/* Overview */}
      <Container bleed className="grid gap-14 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div
          ref={stageRef}
          className="relative order-2 h-[60svh] min-h-[420px] overflow-hidden bg-ink-700 lg:order-1 lg:h-[80svh]"
        >
          <PerfumeExperience
            accent={perfume.accent}
            poster={perfume.hero.src}
            posterAlt={perfume.hero.alt}
            priorityPoster
            scrollProgress={scrollYProgress}
            story="showcase"
          />
        </div>

        <div className="order-1 flex flex-col justify-center lg:order-2">
          <Reveal>
            <span className="eyebrow flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-champagne/60" />
              {perfume.family} &middot; {perfume.concentration}
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 font-serif text-[clamp(2.5rem,6vw,4rem)] font-light leading-[1] text-ivory">
              {perfume.name}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-ivory-dim">
              {perfume.tagline}
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-col gap-4">
              <span className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                Size
              </span>
              <div className="flex flex-wrap gap-3">
                {perfume.sizes.map((s, i) => {
                  const active = i === sizeIndex;
                  return (
                    <button
                      key={s.ml}
                      type="button"
                      onClick={() => setSizeIndex(i)}
                      aria-pressed={active}
                      className={
                        "flex h-12 min-w-20 items-center justify-center border px-4 text-[0.7rem] uppercase tracking-[var(--tracking-wide)] transition-colors duration-500 " +
                        (active
                          ? "border-champagne text-champagne"
                          : "border-line text-ivory-dim hover:border-ivory-dim hover:text-ivory")
                      }
                    >
                      {s.ml} ml
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-10 flex items-center gap-6">
              <span className="font-serif text-2xl text-ivory">
                {formatPrice(size.price, settings.currency)}
              </span>
              <Button variant="solid" disabled>
                Add to bag — soon
              </Button>
            </div>
            <p className="mt-3 text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
              Checkout arrives in a later phase
            </p>
          </Reveal>
        </div>
      </Container>

      {/* Story */}
      <Container className="mt-28">
        <div className="grid gap-10 md:grid-cols-[0.4fr_0.6fr]">
          <Reveal>
            <span className="eyebrow">The composition</span>
          </Reveal>
          <div className="flex flex-col gap-5">
            {paragraphs.map((p, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <p className="text-[1.05rem] leading-relaxed text-ivory-dim">{p}</p>
              </Reveal>
            ))}
            <Reveal delay={0.15}>
              <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-line pt-6 text-sm">
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                    Perfumer
                  </dt>
                  <dd className="mt-1 text-ivory">{perfume.perfumer}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                    First composed
                  </dt>
                  <dd className="mt-1 text-ivory">{perfume.year}</dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </div>
      </Container>

      {/* Notes */}
      <Container className="mt-28">
        <SectionHeading
          eyebrow="Olfactive pyramid"
          title="How it moves"
          intro="Read from the first bright minutes down to what stays on skin hours later."
          className="mb-12"
        />
        <FragranceNotes notes={perfume.notes} />
      </Container>

      {/* Gallery */}
      <Container bleed className="mt-28">
        <div className="grid gap-6 sm:grid-cols-2">
          {perfume.gallery.map((image, i) => (
            <Reveal key={image.src + i} delay={i * 0.06}>
              <div className="relative aspect-[4/5] overflow-hidden bg-ink-700">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </div>
  );
}
