"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Float, PerspectiveCamera } from "@react-three/drei";
import { PerfumeBottle } from "./PerfumeBottle";
import { SceneEnvironment } from "./SceneEnvironment";
import { cn } from "@/lib/utils";

interface PerfumeExperienceProps {
  accent?: string;
  /** Shown while the scene compiles and if WebGL is unavailable. */
  poster: string;
  posterAlt: string;
  className?: string;
  priorityPoster?: boolean;
}

/**
 * The interactive centrepiece. A single flacon on a neutral studio floor that
 * turns slowly and leans toward the cursor. Falls back to the poster image
 * when WebGL cannot start.
 *
 * The pointer is held in a ref and mutated in place — the render loop reads it
 * every frame, so cursor tracking never triggers a React re-render.
 */
export function PerfumeExperience({
  accent = "#c7ac7c",
  poster,
  posterAlt,
  className,
  priorityPoster = false,
}: PerfumeExperienceProps) {
  const pointer = useRef({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    },
    [],
  );

  const resetPointer = useCallback(() => {
    pointer.current.x = 0;
    pointer.current.y = 0;
  }, []);

  return (
    <div
      className={cn("relative h-full w-full", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <Image
        src={poster}
        alt={posterAlt}
        fill
        priority={priorityPoster}
        sizes="(max-width: 1024px) 100vw, 55vw"
        className={cn(
          "object-cover transition-opacity duration-1000",
          failed ? "opacity-100" : "opacity-0",
        )}
      />

      {!failed ? (
        <Canvas
          className="!absolute inset-0"
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          fallback={null}
          eventPrefix="client"
          onError={() => setFailed(true)}
        >
          <PerspectiveCamera makeDefault position={[0, 0.4, 6]} fov={38} />
          <Suspense fallback={null}>
            <SceneEnvironment />
            <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.5}>
              <PerfumeBottle accent={accent} pointer={pointer.current} />
            </Float>
            <ContactShadows
              position={[0, -1.7, 0]}
              opacity={0.45}
              scale={9}
              blur={2.6}
              far={4}
              color="#000000"
            />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}
