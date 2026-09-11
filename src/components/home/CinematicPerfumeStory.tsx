"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { PerfumeExperience } from "@/components/three/PerfumeExperience";
import { ButtonLink } from "@/components/ui/Button";
import {
  clamp01,
  interp,
  SCENE_SPLIT,
  trapezoid,
} from "@/components/three/story";

/** 0..1 → 0..1 with eased ends (Perlin smootherstep). Gives the DOM captions
 *  the same settled feel as the damped 3D layer instead of raw linear ramps. */
function smootherstep(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

interface StoryStep {
  index: string;
  title: string;
  body: string;
}

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
  /** House narrative (formerly the standalone <ScrollStory/> section) — now
   *  the closing scenes of this same pinned stage, so the flacon stays on
   *  screen while it reads rather than disappearing between sections. */
  houseEyebrow: string;
  houseHeading: string;
  houseIntro?: string;
  houseSteps: StoryStep[];
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
 * The homepage's cinematic sequence — hero → object → cap → spray → brand
 * line → house narrative — as ONE scroll-linked, ONE pinned stage. The flacon
 * is never remounted or handed off mid-story: a single sticky Canvas stays on
 * screen for the whole track while DOM caption layers cross-fade over it,
 * including the house narrative that used to live in its own separate pinned
 * section (see `SCENE_SPLIT`). Content scrolls the document natively — only
 * the stage itself is `position: sticky`; nothing scroll-jacks the wheel.
 *
 * Progress is applied to the DOM imperatively from one `scrollYProgress` (via
 * a shared spring) listener — no per-element motion values bound through
 * `style`, which is what keeps this off motion's WAAPI mount path. The exact
 * same spring value is also handed straight to <PerfumeExperience/>; the
 * Scene-1/house rescale (`SCENE_SPLIT`) happens once, inside
 * `poseForTrack` (three/story.ts) — one source of truth, not a second scroll
 * system.
 *
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
  houseEyebrow,
  houseHeading,
  houseIntro,
  houseSteps,
}: CinematicPerfumeStoryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const rotateRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const sprayRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  const houseRef = useRef<HTMLDivElement>(null);
  const houseFillRef = useRef<HTMLDivElement>(null);
  const houseLineRefs = useRef<(HTMLElement | null)[]>([]);
  const houseCount = houseSteps.length;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // One lightly-sprung progress value feeds BOTH the captions and the flacon,
  // so the two never drift apart. The 3D layer damps further on top of this;
  // here it just takes the mechanical edge off a fast wheel flick. It is not a
  // second scroll system — it derives from the single `scrollYProgress` above.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.35,
    restDelta: 0.0002,
  });

  const paint = useCallback(
    (raw: number) => {
      const p = clamp01(raw);
      const scene1 = clamp01(p / SCENE_SPLIT);
      const house = clamp01((p - SCENE_SPLIT) / (1 - SCENE_SPLIT));

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
        smootherstep(interp(scene1, [0, 0.1, 0.135], [1, 1, 0])),
        interp(scene1, [0, 0.14], [0, -34]),
      );
      set(
        rotateRef.current,
        smootherstep(trapezoid(scene1, 0.15, 0.19, 0.4, 0.45)),
        interp(scene1, [0.15, 0.45], [24, -24]),
      );
      set(
        capRef.current,
        smootherstep(trapezoid(scene1, 0.47, 0.51, 0.585, 0.62)),
        interp(scene1, [0.47, 0.62], [24, -24]),
      );
      set(
        sprayRef.current,
        smootherstep(trapezoid(scene1, 0.62, 0.665, 0.75, 0.8)),
        interp(scene1, [0.62, 0.8], [24, -24]),
      );

      // Brand line: ramps in on Scene 1's own schedule, then hands off to the
      // house narrative over the first 12% of the house window — a cross-fade
      // at the seam rather than a hard cut or a lingering overlap.
      const brandIn = smootherstep(interp(scene1, [0.8, 0.865, 1], [0, 1, 1]));
      const brandOut = smootherstep(interp(house, [0, 0.12], [1, 0]));
      set(
        brandRef.current,
        brandIn * brandOut,
        interp(scene1, [0.8, 0.93], [40, 0]),
      );

      // House narrative — the former <ScrollStory/> content, now painted in
      // the same stage. Fades in as the brand line fades out, then holds
      // (the per-step timeline below keeps reading) until the whole stage
      // dissolves at the very end of the track.
      set(houseRef.current, smootherstep(interp(house, [0, 0.1], [0, 1])), interp(house, [0, 0.1], [24, 0]));

      if (houseFillRef.current) {
        houseFillRef.current.style.transform = `scaleY(${interp(house, [0, 1], [0.04, 1]).toFixed(4)})`;
      }
      if (houseCount > 0) {
        const span = 1 / houseCount;
        houseLineRefs.current.forEach((el, i) => {
          if (!el) return;
          const start = i * span;
          // Fade window kept tight and INSIDE each step's own span so
          // consecutive steps never sit at high opacity simultaneously — the
          // old ±0.4/1.4·span window put both neighbours at ~73% opacity at
          // every boundary (text visibly overlapping). This window peaks at
          // ~25% simultaneous opacity at the handoff, a clean crossfade.
          const stepOpacity = interp(
            house,
            [
              start - span * 0.05,
              start + span * 0.15,
              start + span * 0.85,
              start + span * 1.05,
            ],
            [0, 1, 1, 0],
          );
          const stepY = reduce
            ? 0
            : interp(house, [start - span * 0.05, start + span * 0.15], [28, 0]);
          el.style.opacity = stepOpacity.toFixed(3);
          el.style.transform = `translateY(${stepY.toFixed(1)}px)`;
        });
      }

      if (cueRef.current) {
        cueRef.current.style.opacity = interp(scene1, [0, 0.03, 0.06], [1, 1, 0]).toFixed(
          3,
        );
      }
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${Math.max(p, 0.001).toFixed(4)})`;
      }

      // Dissolve the whole pinned stage over the final stretch of the ENTIRE
      // track (hero through house) so the hand-off to the product grid is a
      // cross-fade, not a hard cut. Widened to 8% of the track (was 4%): at
      // 4% a fast scroll — which is driven by scroll *position*, not time —
      // could cross the whole window in a single wheel tick and read as an
      // abrupt cut despite the interpolation existing mathematically.
      if (stageRef.current) {
        stageRef.current.style.opacity = interp(p, [0.92, 1], [1, 0]).toFixed(3);
      }
    },
    [reduce, houseCount],
  );

  useMotionValueEvent(smoothProgress, "change", paint);

  // Correct frame on mount (deep link / reload mid-scroll).
  useEffect(() => {
    paint(smoothProgress.get());
  }, [paint, smoothProgress]);

  return (
    <section
      aria-label={`${brandName} — the fragrance in motion`}
      className="relative"
    >
      <div
        ref={trackRef}
        className="relative h-[734svh] md:h-[1000svh]"
      >
        {/* Native-scroll anchor for the "The house" link below — jumps to the
            same offset the house narrative starts painting at, no
            scroll-jacking involved. */}
        <span
          id="house"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-px"
          style={{ top: `${SCENE_SPLIT * 100}%` }}
        />

        <div
          ref={stageRef}
          className="sticky top-0 h-svh overflow-hidden will-change-[opacity]"
        >
          {/* Scene — full-bleed at every breakpoint: the WebGL canvas now owns
              the cinematic environment end to end (see three/SceneBackdrop.tsx)
              instead of sharing the frame with a CSS gradient beside it. Driven
              by the same combined `smoothProgress` the captions use;
              `poseForTrack` (three/story.ts) rescales it internally — Scene 1's
              choreography plays out exactly as tuned, then the flacon eases
              into a continued, gentler presence for the house narrative rather
              than freezing. */}
          <div className="pointer-events-none absolute inset-0 z-[var(--z-scene)]">
            <div className="pointer-events-auto h-full w-full">
              <PerfumeExperience
                accent={accent}
                poster={poster}
                posterAlt={posterAlt}
                priorityPoster
                scrollProgress={smoothProgress}
                story="cinematic"
              />
            </div>
          </div>

          {/* Legibility wash between the object and the type — feathered, and
              responsive (see .story-scrim). Shared by every caption layer,
              hero through house. */}
          <div
            aria-hidden
            className="story-scrim pointer-events-none absolute inset-0 z-[var(--z-scrim)]"
          />

          {/* Caption layers — stacked, only one lit at a time. */}
          <div
            ref={heroRef}
            className="pointer-events-none absolute inset-0 z-[var(--z-caption)] mx-auto flex max-w-[110rem] flex-col justify-center px-[var(--spacing-gutter)] will-change-[opacity,transform]"
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
            className="pointer-events-none absolute inset-0 z-[var(--z-caption)] flex flex-col items-center justify-center px-[var(--spacing-gutter)] text-center will-change-[opacity,transform]"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <span className="eyebrow">{brandStoryEyebrow}</span>
            <p className="mt-7 max-w-3xl font-serif text-[clamp(1.7rem,4vw,2.8rem)] font-light leading-[1.18] text-ivory">
              {brandStory}
            </p>
          </div>

          {/* House narrative — the closing scenes. Same left/type-side
              treatment as the beats above, so the flacon (right side on ≥lg,
              behind the scrim on mobile) keeps reading as the same object the
              whole time rather than being replaced by a new section. */}
          <div
            ref={houseRef}
            className="pointer-events-none absolute inset-0 z-[var(--z-caption)] mx-auto flex max-w-[110rem] flex-col justify-center px-[var(--spacing-gutter)] will-change-[opacity,transform]"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <div className="max-w-md">
              <span className="eyebrow flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-champagne/60" />
                {houseEyebrow}
              </span>
              <h2 className="mt-6 font-serif text-4xl font-light leading-[1.05] text-ivory sm:text-5xl">
                {houseHeading}
              </h2>
              {houseIntro ? (
                <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-ivory-dim">
                  {houseIntro}
                </p>
              ) : null}

              <div className="mt-12 flex items-center gap-4">
                <div className="relative h-40 w-px shrink-0 bg-line">
                  <div
                    ref={houseFillRef}
                    className="absolute left-0 top-0 h-full w-px origin-top bg-champagne"
                    style={{ transform: "scaleY(0.04)" }}
                  />
                </div>
                <div className="relative h-40 flex-1">
                  {houseSteps.map((step, i) => (
                    <article
                      key={step.index}
                      ref={(el) => {
                        houseLineRefs.current[i] = el;
                      }}
                      className="absolute inset-0 flex flex-col gap-3"
                      style={{ opacity: 0 }}
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
          </div>

          {/* Scroll cue + progress rail. */}
          <div
            ref={cueRef}
            className="absolute bottom-8 left-1/2 z-[var(--z-chrome)] hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
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
            className="absolute inset-x-0 bottom-0 z-[var(--z-chrome)] h-px bg-line"
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
      className="pointer-events-none absolute inset-0 z-[var(--z-caption)] mx-auto flex max-w-[110rem] flex-col justify-center px-[var(--spacing-gutter)] will-change-[opacity,transform]"
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
