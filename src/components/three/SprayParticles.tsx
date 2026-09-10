"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  CanvasTexture,
  type Points,
} from "three";
import type { StoryPose } from "./story";

interface SprayParticlesProps {
  /** Scroll-driven pose; `spray` (0..1) is read every frame. Mutated in place. */
  pose: StoryPose;
  /** Hex accent — tints the mist. */
  accent: string;
  /** Particle budget (from the device quality profile). */
  count: number;
  /** Reduced motion: hold a faint static veil instead of an animated plume. */
  reducedMotion?: boolean;
}

/** Soft round sprite, drawn once to a canvas — no network, CSP-safe. */
function useSpriteTexture(): CanvasTexture {
  const texture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2,
      );
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.4, "rgba(255,255,255,0.35)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

const NOZZLE: readonly [number, number, number] = [0, 1.55, 0];
const MAX_LIFE = 1.6;

/**
 * The fragrance-spray scene. A single `Points` cloud rising from the nozzle,
 * additively blended and accent-tinted, its emission and opacity driven by
 * `pose.spray`. Mounted only for the cinematic story (never the detail-page
 * showcase). When `spray` is ~0 the whole thing early-outs and costs nothing.
 *
 * Positions / velocities / life live in plain typed arrays and are stepped in
 * `useFrame`; nothing here allocates per frame or triggers a React render.
 */
export function SprayParticles({
  pose,
  accent,
  count,
  reducedMotion = false,
}: SprayParticlesProps) {
  const points = useRef<Points>(null);
  const texture = useSpriteTexture();

  const { positions, velocities, life } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const life = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Start fully aged so the first press spawns them in order, not in a burst.
      life[i] = MAX_LIFE + (i / count) * MAX_LIFE;
      // A soft scatter above the nozzle — this is also the static veil that the
      // reduced-motion path leaves in place.
      const r = Math.random();
      positions[i * 3] = NOZZLE[0] + (Math.random() - 0.5) * 0.5 * r;
      positions[i * 3 + 1] = NOZZLE[1] + r * 1.4;
      positions[i * 3 + 2] = NOZZLE[2] + (Math.random() - 0.5) * 0.5 * r;
    }
    return { positions, velocities, life };
  }, [count]);

  useFrame((state, delta) => {
    const mesh = points.current;
    if (!mesh) return;
    const s = pose.spray;
    const mat = mesh.material as { opacity: number };

    if (s <= 0.002) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    if (reducedMotion) {
      // A held veil: seat the cloud just above the nozzle once, fade by `s`.
      mat.opacity = s * 0.22;
      return;
    }

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const attr = mesh.geometry.getAttribute("position") as BufferAttribute;
    // Spawn budget scales with emission; never more than a few per frame.
    let spawns = Math.ceil(s * count * dt * 2.2);

    for (let i = 0; i < count; i++) {
      life[i] += dt;
      const alive = life[i] < MAX_LIFE;

      if (!alive && spawns > 0) {
        spawns--;
        life[i] = 0;
        positions[i * 3] = NOZZLE[0] + (Math.random() - 0.5) * 0.05;
        positions[i * 3 + 1] = NOZZLE[1];
        positions[i * 3 + 2] = NOZZLE[2] + (Math.random() - 0.5) * 0.05;
        const spread = 0.5;
        velocities[i * 3] = (Math.random() - 0.5) * spread;
        velocities[i * 3 + 1] = 0.9 + Math.random() * 0.7;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * spread;
      } else if (life[i] < MAX_LIFE) {
        const k = life[i] / MAX_LIFE;
        // Rise, decelerate, drift outward with a little turbulence.
        velocities[i * 3 + 1] *= 1 - dt * 1.4;
        positions[i * 3] +=
          (velocities[i * 3] + Math.sin(t * 2 + i) * 0.06) * dt;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
        positions[i * 3 + 2] +=
          (velocities[i * 3 + 2] + Math.cos(t * 2 + i) * 0.06) * dt;
        // Fan out slightly as it ages.
        positions[i * 3] += velocities[i * 3] * k * dt * 0.6;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * k * dt * 0.6;
      } else {
        // Parked off-scene until reused.
        positions[i * 3 + 1] = -999;
      }
    }

    attr.needsUpdate = true;
    mat.opacity = s * 0.5;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={accent}
        size={0.07}
        sizeAttenuation
        transparent
        depthWrite={false}
        opacity={0}
        blending={AdditiveBlending}
      />
    </points>
  );
}
