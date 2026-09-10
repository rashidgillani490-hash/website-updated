"use client";

import { motion } from "motion/react";
import { PerfumeExperience } from "@/components/three/PerfumeExperience";
import { ButtonLink } from "@/components/ui/Button";
import { easeLuxe, revealLine, stagger } from "@/lib/motion/variants";

interface HeroProps {
  eyebrow: string;
  titleLines: string[];
  intro: string;
  accent: string;
  poster: string;
  posterAlt: string;
}

/**
 * Opening frame: a clipped-line serif headline against the live 3D flacon.
 * The headline animates on mount; the scene runs continuously behind it.
 */
export function Hero({
  eyebrow,
  titleLines,
  intro,
  accent,
  poster,
  posterAlt,
}: HeroProps) {
  return (
    <section className="relative min-h-[calc(100svh-3.5rem)] overflow-hidden">
      {/* Scene layer */}
      <div className="pointer-events-none absolute inset-0 lg:left-[38%]">
        <div className="pointer-events-auto h-full w-full">
          <PerfumeExperience
            accent={accent}
            poster={poster}
            posterAlt={posterAlt}
            priorityPoster
          />
        </div>
      </div>

      {/* Left-to-right scrim so type stays legible over the scene */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(100deg,var(--color-ink)_18%,rgba(10,10,11,0.6)_46%,transparent_72%)]"
      />

      <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-[110rem] flex-col justify-center px-[var(--spacing-gutter)] py-24">
        <motion.div
          className="max-w-2xl"
          variants={stagger(0.12, 0.15)}
          initial="hidden"
          animate="visible"
        >
          <motion.span
            className="eyebrow flex items-center gap-3"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.8, ease: easeLuxe } },
            }}
          >
            <span aria-hidden className="h-px w-10 bg-champagne/60" />
            {eyebrow}
          </motion.span>

          <h1 className="mt-7 font-serif text-[clamp(2.75rem,7vw,5.25rem)] font-light leading-[0.98] tracking-[-0.015em] text-ivory">
            {titleLines.map((line, i) => (
              <span key={i} className="block overflow-hidden">
                <motion.span className="block" variants={revealLine}>
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className="mt-8 max-w-md text-[0.98rem] leading-relaxed text-ivory-dim"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.9, ease: easeLuxe },
              },
            }}
          >
            {intro}
          </motion.p>

          <motion.div
            className="mt-11 flex flex-wrap items-center gap-4"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.9, ease: easeLuxe },
              },
            }}
          >
            <ButtonLink href="/collection" variant="solid">
              Discover the collection
            </ButtonLink>
            <ButtonLink href="/#house" variant="ghost">
              The house
            </ButtonLink>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        <span className="text-[0.6rem] uppercase tracking-[var(--tracking-luxe)] text-smoke">
          Scroll
        </span>
        <motion.span
          className="h-10 w-px bg-gradient-to-b from-champagne/70 to-transparent"
          animate={{ scaleY: [0.3, 1, 0.3], originY: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
