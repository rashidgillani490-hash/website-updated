"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { PerfumeExperience } from "@/components/three/PerfumeExperience";
import { ButtonLink } from "@/components/ui/Button";
import { clamp01, interp, trapezoid } from "@/components/three/story";

interface CinematicPerfumeStoryProps {
  brandName: string;
  eyebrow: string;
  titleLines: string[];
  intro: string;
  /** Scene 5 copy — the configurable brand/website story. */
  brandStory: string;
  brandStoryEyebrow?: string;
  accent: string;
  poster: string;
  posterAlt: string;
}

interface Beat {
  eyebrow: string;
  line: string;
}

const ROTATE_BEAT: Beat = {
  eyebrow: "The object",
  line: "Turned slowly in the round — every facet of the flacon, nothing hidden.",
};
const CAP_BEAT: Beat = {
  eyebrow: "The opening",
  line: "The cap lifts away. What was sealed is ready.",
};
const SPRAY_BEAT: Beat = {
  eyebrow: "The scent",
  line: "One press, and the air in the room changes.",
};

/**
 * Scene 1–5 of the homepage as a single scroll-linked sequence: a pinned stage
 * holding the reusable <PerfumeExperience/> in cinematic mode, with DOM caption
 * layers cross-faded over it. The flacon's revolve / cap-lift / spray and the
 * captions are both keyed off the *same* `scrollYProgress` (via the shared
 * windows in `three/story.ts`), so they read as one narrative rather than two.
 *
 * Progress is applied to the DOM imperatively from one `scrollYProgress`
 * listener — no per-element motion values bound through `style`, which is what
 * keeps this off motion's WAAPI mount path (see ScrollStory for the history).
 * Everything degrades: no WebGL → the poster carries the scene under the same
 * captions; reduced motion → opacity still tracks scroll, transforms are held.
 */
export function CinematicPerfumeStory({
  brandName,
  eyebrow,
  titleLines,
  intro,
  brandStory,
  brandStoryEyebrow = "The house",
  accent,
  poster,
  posterAlt,
}: CinematicPerfumeStoryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLDivElement>(null);
  const rotateRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const sprayRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const paint = useCallback(
    (raw: number) => {
      const p = clamp01(raw);

      const set = (
        el: HTMLElement | null,
        opacity: number,
        y: number,
      ) => {
        if (!el) return;
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = reduce
          ? "none"
          : `translate3d(0, ${y.toFixed(1)}px, 0)`;
        el.style.visibility = opacity < 0.015 ? "hidden" : "visible";
      };

      set(
        heroRef.current,
        interp(p, [0, 0.1, 0.135], [1, 1, 0]),
        interp(p, [0, 0.14], [0, -34]),
      );
      set(
        rotateRef.current,
        trapezoid(p, 0.15, 0.19, 0.4, 0.45),
        interp(p, [0.15, 0.45], [24, -24]),
      );
      set(
        capRef.current,
        trapezoid(p, 0.47, 0.51, 0.585, 0.62),
        interp(p, [0.47, 0.62], [24, -24]),
      );
      set(
        sprayRef.current,
        trapezoid(p, 0.62, 0.665, 0.75, 0.8),
        interp(p, [0.62, 0.8], [24, -24]),
      );
      set(
        brandRef.current,
        interp(p, [0.8, 0.865, 1], [0, 1, 1]),
        interp(p, [0.8, 0.93], [40, 0]),
      );

      if (cueRef.current) {
        cueRef.current.style.opacity = interp(p, [0, 0.03, 0.06], [1, 1, 0]).toFixed(
          3,
        );
      }
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${Math.max(p, 0.001).toFixed(4)})`;
      }
    },
    [reduce],
  );

  useMotionValueEvent(scrollYProgress, "change", paint);

  // Correct frame on mount (deep link / reload mid-scroll).
  useEffect(() => {
    paint(scrollYProgress.get());
  }, [paint, scrollYProgress]);

  return (
    <section
      aria-label={`${brandName} — the fragrance in motion`}
      className="relative bg-ink"
    >
      <div
        ref={trackRef}
        className="relative h-[440svh] md:h-[600svh]"
      >
        <div className="sticky top-0 h-svh overflow-hidden">
          {/* Scene — the reusable experience, scroll-driven. */}
          <div className="pointer-events-none absolute inset-0 lg:left-[30%]">
            <div className="pointer-events-auto h-full w-full">
              <PerfumeExperience
                accent={accent}
                poster={poster}
                posterAlt={posterAlt}
                priorityPoster
                scrollProgress={scrollYProgress}
                story="cinematic"
              />
            </div>
          </div>

          {/* Legibility scrim over the type side. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,var(--color-ink)_16%,rgba(10,10,11,0.62)_46%,transparent_74%)]"
          />

          {/* Caption layers — stacked, only one lit at a time. */}
          <div
            ref={heroRef}
            className="pointer-events-none absolute inset-0 mx-auto flex max-w-[110rem] flex-col justify-center px-[var(--spacing-gutter)] will-change-[opacity,transform]"
          >
            <div className="max-w-2xl">
              <span className="eyebrow flex items-center gap-3">
                <span aria-hidden className="h-px w-10 bg-champagne/60" />
                {eyebrow}
              </span>
              <h1 className="mt-7 font-serif text-[clamp(2.75rem,7vw,5.25rem)] font-light leading-[0.98] tracking-[-0.015em] text-ivory">
                {titleLines.map((line, i) => (
                  <span key={i} className="block overflow-hidden">
                    <span className="block">{line}</span>
                  </span>
                ))}
              </h1>
              <p className="mt-8 max-w-md text-[0.98rem] leading-relaxed text-ivory-dim">
                {intro}
              </p>
              <div className="pointer-events-auto mt-11 flex flex-wrap items-center gap-4">
                <ButtonLink href="/collection" variant="solid">
                  Discover the collection
                </ButtonLink>
                <ButtonLink href="#house" variant="ghost">
                  The house
                </ButtonLink>
              </div>
            </div>
          </div>

          <BeatCaption innerRef={rotateRef} beat={ROTATE_BEAT} />
          <BeatCaption innerRef={capRef} beat={CAP_BEAT} />
          <BeatCaption innerRef={sprayRef} beat={SPRAY_BEAT} />

          <div
            ref={brandRef}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-[var(--spacing-gutter)] text-center will-change-[opacity,transform]"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <span className="eyebrow">{brandStoryEyebrow}</span>
            <p className="mt-7 max-w-3xl font-serif text-[clamp(1.7rem,4vw,2.8rem)] font-light leading-[1.18] text-ivory">
              {brandStory}
            </p>
          </div>

          {/* Scroll cue + progress rail. */}
          <div
            ref={cueRef}
            className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
          >
            <span className="text-[0.6rem] uppercase tracking-[var(--tracking-luxe)] text-smoke">
              Scroll
            </span>
            <span
              aria-hidden
              className="scroll-cue-line h-10 w-px bg-gradient-to-b from-champagne/70 to-transparent"
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px bg-line"
          >
            <div
              ref={fillRef}
              className="h-full w-full origin-left bg-champagne/70"
              style={{ transform: "scaleX(0.001)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function BeatCaption({
  innerRef,
  beat,
}: {
  innerRef: React.RefObject<HTMLDivElement | null>;
  beat: Beat;
}) {
  return (
    <div
      ref={innerRef}
      className="pointer-events-none absolute inset-0 mx-auto flex max-w-[110rem] flex-col justify-center px-[var(--spacing-gutter)] will-change-[opacity,transform]"
      style={{ opacity: 0, visibility: "hidden" }}
    >
      <div className="max-w-sm">
        <span className="eyebrow flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-champagne/60" />
          {beat.eyebrow}
        </span>
        <p className="mt-5 font-serif text-[clamp(1.4rem,3vw,2rem)] font-light leading-[1.25] text-ivory">
          {beat.line}
        </p>
      </div>
    </div>
  );
}
