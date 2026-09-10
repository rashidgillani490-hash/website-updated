"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Container } from "@/components/ui/Container";

interface StoryStep {
  index: string;
  title: string;
  body: string;
}

interface ScrollStoryProps {
  eyebrow: string;
  heading: string;
  steps: StoryStep[];
}

/**
 * A properly scroll-driven section: one tall track, a pinned panel, and copy
 * whose opacity and position are bound to scroll progress rather than to a
 * one-shot in-view trigger. A vertical rule tracks progress alongside.
 */
export function ScrollStory({ eyebrow, heading, steps }: ScrollStoryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  return (
    <section id="house" className="relative bg-ink">
      <div ref={trackRef} className="relative" style={{ height: `${steps.length * 90}vh` }}>
        <div className="sticky top-0 flex h-svh items-center overflow-hidden">
          <Container bleed className="grid w-full gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-center">
              <span className="eyebrow flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-champagne/60" />
                {eyebrow}
              </span>
              <h2 className="mt-6 max-w-md font-serif text-4xl font-light leading-[1.05] text-ivory sm:text-5xl">
                {heading}
              </h2>

              <div className="mt-12 flex items-center gap-4">
                <ProgressRule progress={scrollYProgress} />
                <div className="relative h-40 flex-1">
                  {steps.map((step, i) => (
                    <StoryLine
                      key={step.index}
                      step={step}
                      index={i}
                      count={steps.length}
                      progress={scrollYProgress}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative hidden items-center justify-center lg:flex">
              <StoryGlyph progress={scrollYProgress} count={steps.length} />
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}

function ProgressRule({ progress }: { progress: MotionValue<number> }) {
  const scaleY = useTransform(progress, [0, 1], [0.04, 1]);
  return (
    <div className="relative h-40 w-px shrink-0 bg-line">
      <motion.div
        className="absolute left-0 top-0 w-px origin-top bg-champagne"
        style={{ height: "100%", scaleY }}
      />
    </div>
  );
}

function StoryLine({
  step,
  index,
  count,
  progress,
}: {
  step: StoryStep;
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const span = 1 / count;
  const start = index * span;
  const opacity = useTransform(
    progress,
    [start - span * 0.4, start + span * 0.15, start + span * 0.85, start + span * 1.4],
    [0, 1, 1, 0],
  );
  const y = useTransform(
    progress,
    [start - span * 0.4, start + span * 0.15],
    [28, 0],
  );

  return (
    <motion.article
      className="absolute inset-0 flex flex-col gap-3"
      style={{ opacity, y }}
    >
      <span className="font-serif text-sm text-champagne">{step.index}</span>
      <h3 className="font-serif text-2xl font-light text-ivory">{step.title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-ivory-dim">{step.body}</p>
    </motion.article>
  );
}

/** A quiet geometric mark that rotates and scales through the section. */
function StoryGlyph({
  progress,
  count,
}: {
  progress: MotionValue<number>;
  count: number;
}) {
  const rotate = useTransform(progress, [0, 1], [0, 90 * count]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.9, 1.05, 0.9]);
  return (
    <motion.div
      className="relative h-[26rem] w-[26rem]"
      style={{ rotate, scale }}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full border border-line" />
      <div className="absolute inset-[15%] rounded-full border border-line/70" />
      <div className="absolute inset-[32%] border border-champagne/40" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line/60" />
      <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-line/60" />
    </motion.div>
  );
}
