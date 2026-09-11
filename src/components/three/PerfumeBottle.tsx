"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { MathUtils } from "three";
import type { StoryPose } from "./story";

interface PerfumeBottleProps {
  /** Hex accent that tints the glass. */
  accent: string;
  /** Pointer position, normalised to -1..1, for parallax. */
  pointer: { x: number; y: number };
  /**
   * When true: no continuous rotation, no pointer parallax. The flacon holds
   * a fixed three-quarter pose. `<Float>` is disabled by the parent.
   */
  reducedMotion?: boolean;
  /**
   * Scroll-driven pose (cinematic / showcase story). When provided the flacon
   * stops its idle turn and follows this instead: `spin` sets the Y rotation,
   * `capLift` raises the cap sub-group clear of the neck. Mutated in place by
   * <ScrollDirector> each frame — never a new object — so it causes no React
   * re-render. Absent on the plain hero/detail scene.
   */
  pose?: StoryPose;
}

/**
 * A procedural flacon — no external model. Rounded glass body, frosted collar,
 * metal cap. Kept deliberately architectural so it reads as a brand object
 * rather than a product render.
 *
 * The `group` ref drives the revolve; `cap` is its own sub-group so the
 * cinematic story can lift it clear of the neck. Only the body glass is
 * physically transmissive — see the note on the inner volume below.
 */
export function PerfumeBottle({
  accent,
  pointer,
  reducedMotion = false,
  pose,
}: PerfumeBottleProps) {
  const group = useRef<Group>(null);
  const cap = useRef<Group>(null);

  useFrame((_, delta) => {
    const g = group.current;
    const c = cap.current;
    if (!g) return;

    // Framerate-independent smoothing. `delta` can spike after a tab regains
    // focus; clamp it so nothing lurches.
    const dt = Math.min(delta, 0.1);

    if (pose) {
      // Scroll owns the motion. Damp toward the target so a fast flick of the
      // wheel eases in rather than snapping; reduced motion tracks 1:1.
      const yaw = pose.spin + pointer.x * 0.12;
      g.rotation.y = reducedMotion ? yaw : MathUtils.damp(g.rotation.y, yaw, 6, dt);
      g.rotation.x = reducedMotion
        ? 0
        : MathUtils.damp(g.rotation.x, pointer.y * 0.1, 4, dt);

      // Translation / scale come from <ScrollDirector>, already damped there, so
      // they are applied straight — no second smoothing pass, no lag. Base
      // group position is [0, -0.1, 0]; pointer adds a hair of x-parallax.
      g.position.x = pose.posX + pointer.x * 0.06;
      g.position.y = -0.1 + pose.posY;
      g.scale.setScalar(pose.scale);

      if (c) {
        const lift = pose.capLift;
        const targetY = 1.62 + lift * 1.15;
        const targetTilt = lift * 0.5;
        const targetX = lift * 0.32;
        if (reducedMotion) {
          c.position.y = targetY;
          c.rotation.z = targetTilt;
          c.position.x = targetX;
        } else {
          c.position.y = MathUtils.damp(c.position.y, targetY, 8, dt);
          c.rotation.z = MathUtils.damp(c.rotation.z, targetTilt, 8, dt);
          c.position.x = MathUtils.damp(c.position.x, targetX, 8, dt);
        }
      }
      return;
    }

    if (reducedMotion) return;

    // Idle scene: continuous slow turn, plus an eased lean toward the cursor.
    g.rotation.y += dt * 0.28;
    g.rotation.x = MathUtils.lerp(g.rotation.x, pointer.y * 0.18, 0.05);
    g.position.x = MathUtils.lerp(g.position.x, pointer.x * 0.15, 0.05);
  });

  return (
    <group
      ref={group}
      position={[0, -0.1, 0]}
      rotation={reducedMotion && !pose ? [0.05, -0.5, 0] : [0, 0, 0]}
    >
      {/* Body — the ONLY glass / transmissive surface on this model.
          `transmission` forces three.js to render an extra opaque pass each
          frame and runs the heavy refraction BSDF per fragment, so it is kept
          to this one mesh. transmission / roughness / ior / clearcoat are
          fundamentally unchanged for the luminous rework — only
          `envMapIntensity` was lifted, proportionally to the brighter
          environment (SceneEnvironment / quality.ts), so a richer environment
          produces richer reflections rather than the material being forced
          brighter on its own. */}
      <RoundedBox args={[1.5, 2.3, 0.9]} radius={0.12} smoothness={8} castShadow>
        <meshPhysicalMaterial
          color={accent}
          transmission={0.92}
          thickness={1.4}
          roughness={0.08}
          ior={1.46}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={1.35}
          attenuationColor={accent}
          attenuationDistance={1.6}
        />
      </RoundedBox>

      {/* Inner liquid volume — an opaque tinted core, NOT glass (no
          transmission/ior/clearcoat here). Because it is opaque it sits in the
          scene that the body glass refracts, so it reads as a full flacon of
          fragrance seen through the glass without a second transmission pass
          or any transparency sorting. Roughness lowered a touch from a flat
          matte so it picks up a soft liquid sheen under the rim light instead
          of reading inert. */}
      <RoundedBox
        args={[1.24, 1.7, 0.62]}
        radius={0.06}
        smoothness={6}
        position={[0, -0.22, 0]}
      >
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0} />
      </RoundedBox>

      {/* Frosted collar — physically-based but deliberately NOT glass: the
          frosted look comes from high roughness on an opaque surface, not
          transmission, so it never competes with the body for "the" glass
          highlight. `envMapIntensity` kept meaningfully lower than the glass
          and cap (proportionally lifted, same as they were) — a frosted
          surface should show only a soft, diffuse hint of the brighter
          environment, not a clear reflection. Stays with the body when the
          cap lifts. */}
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.22, 48]} />
        <meshPhysicalMaterial
          color="#e9e4d8"
          roughness={0.85}
          metalness={0}
          envMapIntensity={0.75}
        />
      </mesh>

      {/* Cap — its own sub-group so the story can lift it clear of the neck.
          Both pieces are metal (no transmission/ior — glass properties don't
          apply here); the body carries a thin lacquer clearcoat for a
          polished-metal read, while the trim ring stays a plain, fully
          polished metal so it reads as the brighter, harder accent.
          `envMapIntensity` lifted to match the brighter environment — metal
          has no diffuse term, so this is what makes its highlights read at
          all. Roughness tightened a touch (metal has no diffuse response to
          fall back on, so a slightly harder surface is what keeps it reading
          as real polished metal against the new bright reflection card
          rather than a soft, glowing-plastic sheen). */}
      <group ref={cap} position={[0, 1.62, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.5, 48]} />
          <meshPhysicalMaterial
            color="#1b1b1d"
            roughness={0.3}
            metalness={0.9}
            clearcoat={0.6}
            clearcoatRoughness={0.25}
            envMapIntensity={1.2}
          />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.4, 0.38, 0.08, 48]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.2}
            metalness={1}
            envMapIntensity={1.2}
          />
        </mesh>
      </group>
    </group>
  );
}
