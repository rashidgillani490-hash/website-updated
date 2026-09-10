"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { MathUtils, type PerspectiveCamera } from "three";
import { poseFor, type StoryMode, type StoryPose } from "./story";

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
}

const BASE_Z = 6;
const BASE_Y = 0.4;

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
}: ScrollDirectorProps) {
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;

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
    const target = poseFor(progress.get(), mode);
    const cur = pose.current;
    const dt = Math.min(delta, 0.1);

    if (reducedMotion) {
      cur.spin = target.spin;
      cur.capLift = target.capLift;
      cur.spray = target.spray;
      cur.dolly = target.dolly;
    } else {
      cur.spin = MathUtils.damp(cur.spin, target.spin, 5, dt);
      cur.capLift = MathUtils.damp(cur.capLift, target.capLift, 8, dt);
      cur.spray = MathUtils.damp(cur.spray, target.spray, 7, dt);
      cur.dolly = MathUtils.damp(cur.dolly, target.dolly, 4, dt);
    }

    // Subtle dolly-in; keep it small so the flacon never leaves frame.
    camera.position.z = BASE_Z - cur.dolly * 1.1;
    camera.position.y = BASE_Y + cur.dolly * 0.22;
    camera.lookAt(0, cur.dolly * 0.08, 0);

    // Still settling? keep the loop alive for one more frame.
    if (
      !reducedMotion &&
      active &&
      (Math.abs(cur.spin - target.spin) > 1e-3 ||
        Math.abs(cur.capLift - target.capLift) > 1e-3 ||
        Math.abs(cur.spray - target.spray) > 1e-3 ||
        Math.abs(cur.dolly - target.dolly) > 1e-3)
    ) {
      invalidate();
    }
  });

  return null;
}
