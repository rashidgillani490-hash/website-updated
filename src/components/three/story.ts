/**
 * Scroll → pose maths for the cinematic perfume story.
 *
 * Pure functions, shared by the WebGL layer (ScrollDirector, in the lazy
 * three.js chunk) and the DOM caption layer (CinematicPerfumeStory, in the main
 * bundle) so the flacon's motion and the on-screen copy are locked to the exact
 * same scroll windows — one narrative, not two timelines that drift.
 *
 * No three.js / react-three-fiber imports here: this file is safe to pull into
 * the main bundle.
 */

export type StoryMode = "cinematic" | "showcase";

export interface StoryPose {
  /** Absolute Y rotation of the flacon, radians. */
  spin: number;
  /** How far the cap has lifted away, 0..1. */
  capLift: number;
  /** Fragrance-spray emission strength, 0..1 (always 0 in "showcase"). */
  spray: number;
  /** Camera dolly-in amount, 0..1. */
  dolly: number;
}

/** Scene windows over global scroll progress (0..1). Ends overlap on purpose
 *  so one beat hands off to the next without a dead frame. */
export const SCENES = {
  hero: [0.0, 0.14],
  rotate: [0.12, 0.46],
  cap: [0.46, 0.62],
  spray: [0.6, 0.8],
  brand: [0.8, 1.0],
} as const;

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Piecewise-linear map with clamped ends — the plain-JS stand-in for
 * useTransform used across the storefront. `input` must be non-decreasing.
 */
export function interp(t: number, input: number[], output: number[]): number {
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

/** Ramp 0→1 across [a,b], hold, then 1→0 across [c,d]. Used for the fade of a
 *  caption that is only on screen for its own scene. */
export function trapezoid(
  t: number,
  a: number,
  b: number,
  c: number,
  d: number,
): number {
  return interp(t, [a, b, c, d], [0, 1, 1, 0]);
}

const TAU = Math.PI * 2;

/**
 * The target pose for a given scroll progress. Damped toward, never snapped, by
 * the caller — so this only has to describe the destination, not the easing.
 */
export function poseFor(progress: number, mode: StoryMode = "cinematic"): StoryPose {
  const p = clamp01(progress);

  if (mode === "showcase") {
    // Perfume detail page: a calm, bounded turn while the flacon is in view,
    // with a small cap tease near the end. No spray.
    return {
      spin: interp(p, [0, 1], [-0.5, -0.5 + TAU * 0.75]),
      capLift: interp(p, [0.62, 1], [0, 0.22]),
      spray: 0,
      dolly: interp(p, [0, 1], [0, 0.18]),
    };
  }

  return {
    // Scene 2 — a complete revolution through the rotate window.
    spin: interp(p, [SCENES.rotate[0], SCENES.rotate[1]], [0, TAU]),
    // Scene 3 — the cap lifts clear, then stays clear.
    capLift: interp(p, [SCENES.cap[0], SCENES.cap[1]], [0, 1]),
    // Scene 4 — a press: fast in, brief sustain, soft release.
    spray: interp(
      p,
      [SCENES.spray[0], SCENES.spray[0] + 0.04, 0.72, SCENES.spray[1]],
      [0, 1, 0.5, 0],
    ),
    // Slow push-in that settles as the brand copy arrives.
    dolly: interp(p, [0, SCENES.hero[1], SCENES.brand[0], 1], [0, 0.16, 0.16, 0.4]),
  };
}
