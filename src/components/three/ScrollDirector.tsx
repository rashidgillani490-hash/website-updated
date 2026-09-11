"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { MathUtils, type Light, type PerspectiveCamera } from "three";
import { poseForTrack, type StoryMode, type StoryPose } from "./story";

interface ScrollDirectorProps {
  /** Global scroll progress of the story track, 0..1. */
  progress: MotionValue<number>;
  /** Live pose, mutated in place each frame (read by the flacon + spray). */
  pose: React.MutableRefObject<StoryPose>;
  mode: StoryMode;
  reducedMotion: boolean;
  /** Scene is on-screen and the tab is visible. When false the director stops
   *  asking for frames so the demand loop can idle. */
  active: boolean;
  /**
   * When true, something else (drei's `<OrbitControls>` on the detail page)
   * owns `camera.position` / orientation every frame — this director must not
   * also write them, or the two would fight for control each frame. The
   * object's own pose (spin/capLift/position/scale/emphasis) and FOV are
   * unaffected — FOV doesn't conflict with orbit controls, only position and
   * look-at do. Defaults to false (unchanged behaviour everywhere else).
   */
  cameraControlled?: boolean;
}

const BASE_Z = 6;
const BASE_Y = 0.4;
/** Key/rim intensities from SceneEnvironment; `emphasis` adds a fraction of
 *  each — the same lift on both, so the detail beats read as the scene's own
 *  lighting responding, not a single light flaring up. Base values match
 *  SceneEnvironment's own JSX intensities (the pre-scroll starting point);
 *  gain is the peak lift through the cap + spray (and house-close) beats. */
const KEY_LIGHT_BASE = 280;
const KEY_LIGHT_GAIN = 120;
const RIM_LIGHT_BASE = 6.0;
const RIM_LIGHT_GAIN = 2.5;

/**
 * Turns scroll progress into the flacon's pose. Lives inside the <Canvas>, so
 * it can drive the camera and request frames through react-three-fiber's
 * `invalidate` — the demand render loop only wakes when the pose actually
 * changes (a scroll tick) or is still settling toward its target.
 *
 * Nothing here allocates per frame; `pose.current` is the same object every
 * time, so the flacon and spray read it without a React re-render.
 */
export function ScrollDirector({
  progress,
  pose,
  mode,
  reducedMotion,
  active,
  cameraControlled = false,
}: ScrollDirectorProps) {
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const scene = useThree((s) => s.scene);

  // Every scroll tick asks for exactly one frame; the settle test in useFrame
  // keeps rendering until the damp has caught up, then it stops on its own.
  useEffect(() => {
    const unsub = progress.on("change", () => {
      if (active) invalidate();
    });
    return () => unsub();
  }, [progress, invalidate, active]);

  // Paint the correct frame on mount (deep links / reload mid-scroll).
  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useFrame((_, delta) => {
    // `progress` is the combined track for the cinematic story (Scene 1 +
    // house narrative) or the detail page's own bounded 0..1 for showcase;
    // `poseForTrack` resolves either into one target pose — reusing the exact
    // same scroll value the DOM caption layer reads, no second scroll system.
    const target = poseForTrack(progress.get(), mode);
    const cur = pose.current;
    const dt = Math.min(delta, 0.1);

    if (reducedMotion) {
      cur.spin = target.spin;
      cur.capLift = target.capLift;
      cur.spray = target.spray;
      cur.dolly = target.dolly;
      cur.posX = target.posX;
      cur.posY = target.posY;
      cur.scale = target.scale;
      cur.emphasis = target.emphasis;
      cur.fov = target.fov;
      cur.camX = target.camX;
    } else {
      cur.spin = MathUtils.damp(cur.spin, target.spin, 5, dt);
      cur.capLift = MathUtils.damp(cur.capLift, target.capLift, 8, dt);
      cur.spray = MathUtils.damp(cur.spray, target.spray, 7, dt);
      // Slightly softer than before (was 4) — dolly's own curve is steeper
      // now (the IMPACT/DETAIL push), so the same reasoning as fov/camX
      // applies: a softer chase keeps a fast scroll gliding through the
      // push rather than snapping toward it.
      cur.dolly = MathUtils.damp(cur.dolly, target.dolly, 3.2, dt);
      // Position / scale ease a touch slower — this is the "weight" of the
      // object; a fast flick of the wheel should glide, not twitch.
      cur.posX = MathUtils.damp(cur.posX, target.posX, 3.5, dt);
      cur.posY = MathUtils.damp(cur.posY, target.posY, 3, dt);
      cur.scale = MathUtils.damp(cur.scale, target.scale, 3.5, dt);
      cur.emphasis = MathUtils.damp(cur.emphasis, target.emphasis, 5, dt);
      // Camera channels — slightly slower than the object's own channels on
      // purpose: the FOV/dolly curves are intentionally steep now (the
      // IMPACT/DETAIL push), and a slower chase is what keeps a fast flick of
      // the wheel reading as a smooth glide through that steep region rather
      // than a snap — same exponential-damp architecture, just a softer
      // constant, not a different easing model.
      cur.fov = MathUtils.damp(cur.fov, target.fov, 3.2, dt);
      cur.camX = MathUtils.damp(cur.camX, target.camX, 2.8, dt);
    }

    // Dolly: an aggressive, deliberate push-in (see story.ts) for the
    // IMPACT/DETAIL beat — still kept well clear of the object. The flacon's
    // furthest possible point toward the camera (a rotated body corner, ~0.9
    // world units) never comes closer than ~4 units to the camera at the
    // deepest dolly, so there is no clipping risk (verified numerically).
    // Framing the *entire* lifted cap at the tightest moment is NOT
    // guaranteed by design — see story.ts's dolly/fov comment: visual drama
    // at the hero/detail beat takes priority over full-bottle framing there,
    // approved explicitly. The body is never at risk of leaving frame.
    //
    // Skipped entirely when `cameraControlled` — OrbitControls (detail page)
    // recomputes camera.position from its own stored orbit state every
    // frame regardless of what runs before it, so writing here would either
    // be silently discarded or fight it depending on hook registration
    // order. Better to make the hand-off explicit.
    if (!cameraControlled) {
      camera.position.z = BASE_Z - cur.dolly * 1.85;
      camera.position.y = BASE_Y + cur.dolly * 0.26;
      // Camera reframe: pans laterally (house window only — see story.ts)
      // while continuing to look toward the object, which is what makes a
      // lateral `position.x` move read as a deliberate pan/arc rather than a
      // slide.
      camera.position.x = cur.camX;
      // Look-at rises with the dolly — keeps the composition following the
      // object as the camera pushes in (more of the collar/cap stays framed)
      // rather than only zooming on a fixed point.
      camera.lookAt(0, cur.dolly * 0.2, 0);
    }

    // FOV: a restrained telephoto compression through the detail beats.
    // `updateProjectionMatrix` is required after any runtime FOV change.
    if (camera.fov !== cur.fov) {
      camera.fov = cur.fov;
      camera.updateProjectionMatrix();
    }

    // Lighting emphasis — a restrained lift on the key + rim lights through
    // the cap + spray (and, in the house window, the closing) beats. Guarded
    // so a scene without either named light is a no-op.
    const key = scene.getObjectByName("keyLight") as Light | undefined;
    if (key) key.intensity = KEY_LIGHT_BASE + cur.emphasis * KEY_LIGHT_GAIN;
    const rim = scene.getObjectByName("rimLight") as Light | undefined;
    if (rim) rim.intensity = RIM_LIGHT_BASE + cur.emphasis * RIM_LIGHT_GAIN;

    // Still settling? keep the loop alive for one more frame.
    if (
      !reducedMotion &&
      active &&
      (Math.abs(cur.spin - target.spin) > 1e-3 ||
        Math.abs(cur.capLift - target.capLift) > 1e-3 ||
        Math.abs(cur.spray - target.spray) > 1e-3 ||
        Math.abs(cur.dolly - target.dolly) > 1e-3 ||
        Math.abs(cur.posX - target.posX) > 1e-3 ||
        Math.abs(cur.posY - target.posY) > 1e-3 ||
        Math.abs(cur.scale - target.scale) > 1e-3 ||
        Math.abs(cur.emphasis - target.emphasis) > 1e-3 ||
        Math.abs(cur.fov - target.fov) > 1e-3 ||
        Math.abs(cur.camX - target.camX) > 1e-3)
    ) {
      invalidate();
    }
  });

  return null;
}
