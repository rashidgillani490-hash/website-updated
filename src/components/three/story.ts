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
  /** Flacon world-X offset. Small: the object drifts from just off the type
   *  toward centre as the caption side clears. */
  posX: number;
  /** Flacon world-Y offset — a slow per-scene "breath", a few cm of travel. */
  posY: number;
  /** Flacon uniform scale. Stays within a narrow band around 1. */
  scale: number;
  /** Lighting / glow emphasis, 0..1 — lifts through the cap + spray beats and
   *  settles for the brand line. Drives the key + rim light intensity. */
  emphasis: number;
  /** Camera field of view, degrees. Wider for the establishing hero/final
   *  frames, narrower (a touch of telephoto compression) through the detail
   *  beats. Independent of the flacon's own `scale` — this is the camera
   *  choosing a different frame, not the object changing size. */
  fov: number;
  /** Camera world-X offset — independent of the flacon's own `posX`. Held at
   *  0 through the object beats (a steady camera watching the flacon turn);
   *  pans gently for the house narrative, working *with* the flacon's own
   *  drift to open room for the copy rather than just moving the object. */
  camX: number;
}

/** Scene windows over Scene 1's own progress (0..1). Ends overlap on purpose
 *  so one beat hands off to the next without a dead frame. */
export const SCENES = {
  hero: [0.0, 0.14],
  rotate: [0.12, 0.46],
  cap: [0.46, 0.62],
  spray: [0.6, 0.8],
  brand: [0.8, 1.0],
} as const;

/**
 * Fraction of the *combined* track (Scene 1 + the house narrative that
 * follows it) given to Scene 1; the remainder is the house window. Single
 * source of truth for both the 3D layer (`poseForTrack`, below) and the DOM
 * caption layer (`CinematicPerfumeStory`), so the pose split and the copy
 * split can never drift apart. The matching track-height classes there
 * (`h-[734svh] md:h-[1000svh]`) are sized so the pixel split lands here too:
 * 440/734 = 600/1000 = 0.6.
 */
export const SCENE_SPLIT = 0.6;

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
    // with a small cap tease near the end. No spray, no drift beyond a hair.
    return {
      spin: interp(p, [0, 1], [-0.5, -0.5 + TAU * 0.75]),
      capLift: interp(p, [0.62, 1], [0, 0.22]),
      spray: 0,
      dolly: interp(p, [0, 1], [0, 0.18]),
      posX: interp(p, [0, 1], [0.1, 0]),
      posY: 0,
      scale: interp(p, [0, 1], [0.98, 1.04]),
      emphasis: interp(p, [0, 1], [0, 0.35]),
      // Showcase keeps a calm, near-static frame — no dramatic reframing on
      // the smaller detail-page stage, just a hair of settle.
      fov: interp(p, [0, 1], [38, 37]),
      camX: 0,
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
    // Camera dolly: calm through the hero and the turn, then an aggressive,
    // deliberate push-in through the cap + spray beats — the IMPACT/DETAIL
    // pass. This is a genuine macro-commercial push: the bottle is meant to
    // become physically dominant here, not just "a bit closer" (see the
    // clipping-margin note in ScrollDirector — the object body is always
    // safe; the very top of the lifted cap leaving frame at the tightest
    // instant is an approved, intentional trade-off, not a bug). Eases back
    // out as the brand line arrives so the object isn't left cropped there.
    dolly: interp(
      p,
      [0, SCENES.hero[1], SCENES.rotate[1], SCENES.cap[1], SCENES.spray[1], 1],
      [0, 0.12, 0.12, 0.62, 0.62, 0.26],
    ),
    // Presented with room to breathe in the hero — this is the object's own
    // contribution to keeping clear of the type; the camera holds centred and
    // steady through every object beat (see `camX`) so the flacon's turn
    // reads as a clean turntable shot, not a turn-and-pan at once. Eases
    // fully to centre by the end of the turn and stays there. World units —
    // kept small so the flacon never leaves frame on any viewport.
    posX: interp(
      p,
      [SCENES.hero[1], SCENES.rotate[1], 1],
      [0.46, 0, 0],
    ),
    // A slow vertical breath, distinct per beat, never more than a few cm.
    posY: interp(
      p,
      [0, 0.25, 0.55, 0.85, 1],
      [0, 0.06, -0.05, 0.05, 0],
    ),
    // Narrow band around 1: reads as a gentle presence, not a zoom.
    scale: interp(
      p,
      [0, SCENES.hero[1], SCENES.brand[0], 1],
      [0.97, 1.0, 1.05, 1.06],
    ),
    // Rises through the cap + spray beats, eases back for the brand copy.
    emphasis: interp(p, [SCENES.rotate[1], 0.55, 0.72, 1], [0, 0.4, 1, 0.65]),
    // Wide, editorial establishing frame in the hero; a strong telephoto
    // compression through the detail beats (compounds with `dolly` — closer
    // AND meaningfully narrower reads as a deliberate macro close-up, not
    // just "moved forward"); opens back out to the same wide establishing
    // frame for the brand line. An 8° swing — deliberate, still short of
    // anything that would distort the object (see PHASE 2 approval note).
    fov: interp(
      p,
      [0, SCENES.hero[1], SCENES.rotate[1], SCENES.cap[1], SCENES.spray[1], 1],
      [40, 40, 38, 32, 32, 40],
    ),
    // Camera stays put through every object beat — see the `posX` note above.
    camX: 0,
  };
}

interface HouseDrift {
  /** Added to the resting spin — a bare continuation, not a new turn. */
  spin: number;
  /** Added to the resting posX — eases the flacon aside to give the house
   *  narrative's left-aligned copy room, then eases back for the close. */
  posX: number;
  /** Added to the resting posY — a slow, non-repeating breath. */
  posY: number;
  /** Absolute target scale for the close — a touch calmer than Scene 1's
   *  resting scale. */
  scale: number;
  /** Absolute target dolly for the close — wider than the detail beats, an
   *  elegant final frame rather than a crop. */
  dolly: number;
  /** Absolute target light emphasis for the close. */
  emphasis: number;
  /** Added to the resting camX — the camera's own contribution to reframing
   *  for the house narrative's copy, working alongside the flacon's `posX`
   *  drift (see `poseForTrack`) rather than leaving it to do the job alone. */
  camX: number;
  /** Absolute target FOV for the close — a touch wider than the detail beats,
   *  a calm editorial frame for the closing narrative. */
  fov: number;
}

/**
 * Continuation for the house narrative — the scroll beyond Scene 1 (see
 * `SCENE_SPLIT`). By this point the flacon has already finished its story;
 * rather than freezing mid-scroll, it keeps a bare thread of motion alive —
 * shifting aside while the timeline copy reads, a slow breath, a hair of
 * continued turn — then eases to a wider, calmer presentation as the
 * narrative closes. Takes `houseProgress`, 0..1 *within* the house window
 * (not the combined track); every channel is a no-op at 0, so blending it in
 * (see `poseForTrack`) is always continuous — no jump at the seam.
 */
export function houseDriftFor(houseProgress: number): HouseDrift {
  const h = clamp01(houseProgress);
  return {
    spin: interp(h, [0, 1], [0, TAU * 0.05]),
    posX: interp(h, [0, 0.15, 0.85, 1], [0, 0.22, 0.22, 0]),
    posY: interp(h, [0, 0.5, 1], [0, -0.035, 0.015]),
    scale: 1.0,
    dolly: 0.12,
    emphasis: 0.45,
    // A pan the opposite way from the flacon's own shift — reinforces the
    // same compositional opening with a smaller number on each channel,
    // reading as "the camera reframes" rather than "the object slides over".
    camX: interp(h, [0, 0.15, 0.85, 1], [0, -0.2, -0.2, 0]),
    fov: 40,
  };
}

/**
 * Full-track entry point for the 3D layer. Turns the *combined* scroll
 * progress — Scene 1 followed by the house narrative, for the cinematic
 * story — into one `StoryPose`. Scene 1 keeps `poseFor`'s exact, independently
 * tested choreography; past `SCENE_SPLIT` the pose blends smoothly into
 * `houseDriftFor` instead of freezing or resetting. `showcase` has no house
 * phase and passes straight through to `poseFor`.
 */
export function poseForTrack(
  rawProgress: number,
  mode: StoryMode = "cinematic",
): StoryPose {
  if (mode === "showcase") return poseFor(rawProgress, mode);

  const p = clamp01(rawProgress);
  const base = poseFor(clamp01(p / SCENE_SPLIT), mode);

  const houseProgress = clamp01((p - SCENE_SPLIT) / (1 - SCENE_SPLIT));
  if (houseProgress <= 0) return base;

  const drift = houseDriftFor(houseProgress);
  return {
    spin: base.spin + drift.spin,
    capLift: base.capLift,
    spray: base.spray,
    dolly: interp(houseProgress, [0, 1], [base.dolly, drift.dolly]),
    posX: base.posX + drift.posX,
    posY: base.posY + drift.posY,
    scale: interp(houseProgress, [0, 1], [base.scale, drift.scale]),
    emphasis: interp(houseProgress, [0, 1], [base.emphasis, drift.emphasis]),
    camX: base.camX + drift.camX,
    fov: interp(houseProgress, [0, 1], [base.fov, drift.fov]),
  };
}
