"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { Perfume } from "@/lib/content";
import { formatPrice } from "@/lib/utils";
import { fadeUp } from "@/lib/motion/variants";

interface PerfumeCardProps {
  perfume: Perfume;
  currency: string;
  /** Index within a grid, for a subtle stagger. */
  index?: number;
}

export function PerfumeCard({ perfume, currency, index = 0 }: PerfumeCardProps) {
  const from = Math.min(...perfume.sizes.map((s) => s.price));

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      transition={{ delay: (index % 3) * 0.08 }}
      className="group"
    >
      <Link href={`/fragrance/${perfume.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-ink-700">
          <Image
            src={perfume.gallery[0]?.src ?? perfume.hero.src}
            alt={perfume.gallery[0]?.alt ?? perfume.hero.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/70 to-transparent" />
          <span className="absolute left-4 top-4 text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim">
            {perfume.family}
          </span>
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-4">
          <h3 className="font-serif text-xl font-light text-ivory">
            {perfume.name}
          </h3>
          <span className="shrink-0 text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
            From {formatPrice(from, currency)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
          {perfume.tagline}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-500 group-hover:text-champagne">
          View fragrance
          <span
            aria-hidden
            className="h-px w-6 bg-current transition-all duration-500 group-hover:w-9"
          />
        </span>
      </Link>
    </motion.article>
  );
}
