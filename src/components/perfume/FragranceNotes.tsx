"use client";

import { motion } from "motion/react";
import type { FragranceNote, NoteTier } from "@/lib/content";
import { stagger, fadeUp } from "@/lib/motion/variants";

interface FragranceNotesProps {
  notes: FragranceNote[];
}

const TIERS: { key: NoteTier; label: string; hint: string }[] = [
  { key: "top", label: "Top", hint: "First minutes" },
  { key: "heart", label: "Heart", hint: "The body of the scent" },
  { key: "base", label: "Base", hint: "Hours later, on skin" },
];

/**
 * The olfactive pyramid, read top to base. Each tier is a labelled column of
 * notes with a short evocation.
 */
export function FragranceNotes({ notes }: FragranceNotesProps) {
  return (
    <motion.div
      className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3"
      variants={stagger(0.06)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      {TIERS.map((tier) => {
        const tierNotes = notes.filter((n) => n.tier === tier.key);
        return (
          <div key={tier.key} className="bg-ink-800 p-7">
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-lg text-ivory">{tier.label}</span>
              <span className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                {tier.hint}
              </span>
            </div>
            <ul className="mt-5 flex flex-col gap-4">
              {tierNotes.map((note) => (
                <motion.li key={note.name} variants={fadeUp} className="flex flex-col gap-1">
                  <span className="text-sm text-ivory">{note.name}</span>
                  {note.description ? (
                    <span className="text-[0.8rem] leading-snug text-ivory-dim">
                      {note.description}
                    </span>
                  ) : null}
                </motion.li>
              ))}
            </ul>
          </div>
        );
      })}
    </motion.div>
  );
}
