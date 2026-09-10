"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, PerspectiveCamera } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import { PerfumeBottle } from "./PerfumeBottle";
import { SceneEnvironment } from "./SceneEnvironment";
import { ScrollDirector } from "./ScrollDirector";
import { SprayParticles } from "./SprayParticles";
import type { QualityProfile } from "./quality";
import type { StoryMode, StoryPose } from "./story";

interface PerfumeCanvasProps {
  accent: string;
  /** Shared pointer ref, mutated in place by the parent (no re-renders). */
  pointer: { x: number; y: number };
  /** Scene is on-screen and the tab is visible — run the render loop. */
  active: boolean;
  /** OS "reduce motion" — hold a static pose, no float, no auto-loop. */
  reducedMotion: boolean;
  quality: QualityProfile;
  /** Fired once the WebGL context exists (used to cross-fade the poster). */
  onCreated?: () => void;
  /**
   * Scroll progress of the surrounding story track. When present the flacon is
   * driven by scroll (see <ScrollDirector>) instead of its idle turn.
   */
  scrollProgress?: MotionValue<number>;
  /** `"cinematic"` (home story, adds cap-lift + spray) or `"showcase"`
   *  (detail page, a bounded turn). Ignored without `scrollProgress`. */
  story?: StoryMode;
}

/**
 * The heavy WebGL layer. Loaded via `next/dynamic({ ssr: false })` from
 * <PerfumeExperience /> so three.js / drei never enter the server bundle and
 * are only fetched on the client when the scene approaches the viewport.
 *
 * Render strategy is `frameloop="demand"`: nothing renders unless a frame is
 * requested. `FrameManager` requests one continuously while `active &&
 * !reducedMotion` (the flacon's slow turn / the story's damping need it) and
 * requests a single frame on every state change. <ScrollDirector> additionally
 * requests a frame per scroll tick, so a reduced-motion story still tracks
 * scroll without a running loop. When the scene is off-screen or the tab is
 * hidden, `active` is false, no frames are requested, and the loop idles at
 * zero cost.
 */
export default function PerfumeCanvas({
  accent,
  pointer,
  active,
  reducedMotion,
  quality,
  onCreated,
  scrollProgress,
  story,
}: PerfumeCanvasProps) {
  const storyMode: StoryMode | undefined = scrollProgress ? story ?? "showcase" : undefined;
  const scrollDriven = Boolean(scrollProgress && storyMode);
  const animate = active && !reducedMotion;

  // One stable pose object for the whole scene lifetime — ScrollDirector writes
  // it, PerfumeBottle and SprayParticles read it, no React state involved.
  const pose = useRef<StoryPose>({ spin: 0, capLift: 0, spray: 0, dolly: 0 });

  return (
    <Canvas
      className="!absolute inset-0"
      shadows={quality.shadows}
      dpr={quality.dpr}
      frameloop="demand"
      gl={{
        antialias: quality.antialias,
        alpha: true,
        powerPreference: quality.powerPreference,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onCreated?.();
      }}
      eventPrefix="client"
      fallback={null}
    >
      <FrameManager animate={animate} />
      <PerspectiveCamera makeDefault position={[0, 0.4, 6]} fov={38} />
      <Suspense fallback={null}>
        <SceneEnvironment
          resolution={quality.envResolution}
          shadowMapSize={quality.shadowMapSize}
          castShadow={quality.shadows}
        />

        {scrollDriven && scrollProgress ? (
          <ScrollDirector
            progress={scrollProgress}
            pose={pose}
            mode={storyMode as StoryMode}
            reducedMotion={reducedMotion}
            active={active}
          />
        ) : null}

        <Float
          enabled={!reducedMotion && !scrollDriven}
          speed={1.1}
          rotationIntensity={0.25}
          floatIntensity={0.5}
        >
          <PerfumeBottle
            accent={accent}
            pointer={pointer}
            reducedMotion={reducedMotion}
            pose={scrollDriven ? pose.current : undefined}
          />
        </Float>

        {storyMode === "cinematic" ? (
          <SprayParticles
            pose={pose.current}
            accent={accent}
            count={quality.sprayCount}
            reducedMotion={reducedMotion}
          />
        ) : null}

        <ContactShadows
          position={[0, -1.7, 0]}
          opacity={0.45}
          scale={quality.contactShadowScale}
          blur={2.6}
          far={4}
          color="#000000"
          frames={reducedMotion || quality.bakeContactShadow ? 1 : Infinity}
        />
      </Suspense>
    </Canvas>
  );
}

/**
 * Drives `frameloop="demand"`. While `animate`, requests the next frame every
 * frame (keeps the continuous turn / story damping alive). On any `animate`
 * change and on mount, requests exactly one frame so a paused scene resumes and
 * a reduced-motion scene paints its static pose.
 */
function FrameManager({ animate }: { animate: boolean }) {
  const invalidate = useThree((s) => s.invalidate);

  useFrame(() => {
    if (animate) invalidate();
  });

  useEffect(() => {
    invalidate();
  }, [invalidate, animate]);

  return null;
}
