"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, PerspectiveCamera } from "@react-three/drei";
import { PerfumeBottle } from "./PerfumeBottle";
import { SceneEnvironment } from "./SceneEnvironment";
import type { QualityProfile } from "./quality";

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
}

/**
 * The heavy WebGL layer. Loaded via `next/dynamic({ ssr: false })` from
 * <PerfumeExperience /> so three.js / drei never enter the server bundle and
 * are only fetched on the client when the scene approaches the viewport.
 *
 * Render strategy is `frameloop="demand"`: nothing renders unless a frame is
 * requested. `FrameManager` requests one continuously while `active &&
 * !reducedMotion` (the flacon's slow turn needs it) and requests a single
 * frame on every state change (resume from pause, reduced-motion static
 * render). When the scene is off-screen or the tab is hidden, `active` is
 * false, no frames are requested, and the loop idles at zero cost.
 */
export default function PerfumeCanvas({
  accent,
  pointer,
  active,
  reducedMotion,
  quality,
  onCreated,
}: PerfumeCanvasProps) {
  const animate = active && !reducedMotion;

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
        <Float
          enabled={!reducedMotion}
          speed={1.1}
          rotationIntensity={0.25}
          floatIntensity={0.5}
        >
          <PerfumeBottle
            accent={accent}
            pointer={pointer}
            reducedMotion={reducedMotion}
          />
        </Float>
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
 * frame (keeps the continuous turn alive). On any `animate` change and on
 * mount, requests exactly one frame so a paused scene resumes and a
 * reduced-motion scene paints its static pose.
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
