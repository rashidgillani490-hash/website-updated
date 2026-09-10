"use client";

import { useCallback, useEffect, useRef } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";
import { Container } from "@/components/ui/Container";

interface StoryStep {
  index: string;
  title: string;
  body: string;
}

interface ScrollStoryProps {
  eyebrow: string;
  heading: string;
  /** Optional lead paragraph under the heading — the editable brand story. */
  intro?: string;
  steps: StoryStep[];
}

/** Piecewise-linear map with clamped ends — a plain-JS stand-in for useTransform. */
function interp(t: number, input: number[], output: number[]) {
  const last = input.length - 1;
  if (t <= input[0]) return output[0];
  if (t >= input[last]) return output[last];
  for (let i = 1; i <= last; i++) {
    if (t <= input[i]) {
      const denom = input[i] - input[i - 1] || 1;
      const f = (t - input[i - 1]) / denom;
      return output[i - 1] + f * (output[i] - output[i - 1]);
    }
  }
  return output[last];
}

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A scroll-driven section: one tall track, a pinned panel, and copy whose
 * opacity and position follow scroll progress rather than a one-shot in-view
 * trigger. Progress is applied to the DOM imperatively from a single
 * `scrollYProgress` listener — no per-element motion values bound through
 * `style`, which keeps it off motion's WAAPI mount path.
 */
export function ScrollStory({
  eyebrow,
  heading,
  intro,
  steps,
}: ScrollStoryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLElement | null)[]>([]);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const count = steps.length;

  const render = useCallback(
    (p: number) => {
      const reduce = prefersReduced();
      const span = 1 / count;

      if (fillRef.current) {
        fillRef.current.style.transform = `scaleY(${interp(p, [0, 1], [0.04, 1])})`;
      }

      if (glyphRef.current) {
        const rotate = reduce ? 0 : interp(p, [0, 1], [0, 90 * count]);
        const scale = reduce ? 1 : interp(p, [0, 0.5, 1], [0.9, 1.05, 0.9]);
        glyphRef.current.style.transform = `rotate(${rotate}deg) scale(${scale})`;
      }

      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        const start = i * span;
        const opacity = interp(
          p,
          [
            start - span * 0.4,
            start + span * 0.15,
            start + span * 0.85,
            start + span * 1.4,
          ],
          [0, 1, 1, 0],
        );
        const y = reduce
          ? 0
          : interp(p, [start - span * 0.4, start + span * 0.15], [28, 0]);
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${y}px)`;
      });
    },
    [count],
  );

  useMotionValueEvent(scrollYProgress, "change", render);

  // Paint the correct frame on mount (covers deep links / reloads mid-scroll).
  useEffect(() => {
    render(scrollYProgress.get());
  }, [render, scrollYProgress]);

  return (
    <section id="house" className="relative bg-ink">
      <div
        ref={trackRef}
        className="relative"
        style={{ height: `${count * 90}vh` }}
      >
        <div className="sticky top-0 flex h-svh items-center overflow-hidden">
          <Container
            bleed
            className="grid w-full gap-12 lg:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="flex flex-col justify-center">
              <span className="eyebrow flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-champagne/60" />
                {eyebrow}
              </span>
              <h2 className="mt-6 max-w-md font-serif text-4xl font-light leading-[1.05] text-ivory sm:text-5xl">
                {heading}
              </h2>
              {intro ? (
                <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-ivory-dim">
                  {intro}
                </p>
              ) : null}

              <div className="mt-12 flex items-center gap-4">
                <div className="relative h-40 w-px shrink-0 bg-line">
                  <div
                    ref={fillRef}
                    className="absolute left-0 top-0 h-full w-px origin-top bg-champagne"
                    style={{ transform: "scaleY(0.04)" }}
                  />
                </div>
                <div className="relative h-40 flex-1">
                  {steps.map((step, i) => (
                    <article
                      key={step.index}
                      ref={(el) => {
                        lineRefs.current[i] = el;
                      }}
                      className="absolute inset-0 flex flex-col gap-3"
                      style={{ opacity: i === 0 ? 1 : 0 }}
                    >
                      <span className="font-serif text-sm text-champagne">
                        {step.index}
                      </span>
                      <h3 className="font-serif text-2xl font-light text-ivory">
                        {step.title}
                      </h3>
                      <p className="max-w-sm text-sm leading-relaxed text-ivory-dim">
                        {step.body}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative hidden items-center justify-center lg:flex">
              <div
                ref={glyphRef}
                className="relative h-[26rem] w-[26rem]"
                aria-hidden
                style={{ transform: "rotate(0deg) scale(0.9)" }}
              >
                <div className="absolute inset-0 rounded-full border border-line" />
                <div className="absolute inset-[15%] rounded-full border border-line/70" />
                <div className="absolute inset-[32%] border border-champagne/40" />
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line/60" />
                <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-line/60" />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
