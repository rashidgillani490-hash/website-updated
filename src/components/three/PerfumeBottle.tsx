"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { MathUtils } from "three";

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
}

/**
 * A procedural flacon — no external model. Rounded glass body, frosted collar,
 * metal cap. Kept deliberately architectural so it reads as a brand object
 * rather than a product render.
 *
 * The `group` ref is the single handle for the future cinematic sequence
 * (revolve / cap-lift / spray); only the body glass is physically
 * transmissive — see the note on the inner volume below.
 */
export function PerfumeBottle({
  accent,
  pointer,
  reducedMotion = false,
}: PerfumeBottleProps) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || reducedMotion) return;
    // Continuous slow turn, plus an eased lean toward the cursor.
    g.rotation.y += delta * 0.28;
    g.rotation.x = MathUtils.lerp(g.rotation.x, pointer.y * 0.18, 0.05);
    g.position.x = MathUtils.lerp(g.position.x, pointer.x * 0.15, 0.05);
  });

  return (
    <group
      ref={group}
      position={[0, -0.1, 0]}
      rotation={reducedMotion ? [0.05, -0.5, 0] : [0, 0, 0]}
    >
      {/* Body — the only transmissive surface. `transmission` forces three.js
          to render an extra opaque pass each frame and runs the heavy
          refraction BSDF per fragment, so it is kept to this one mesh. */}
      <RoundedBox args={[1.5, 2.3, 0.9]} radius={0.12} smoothness={8} castShadow>
        <meshPhysicalMaterial
          color={accent}
          transmission={0.92}
          thickness={1.4}
          roughness={0.12}
          ior={1.46}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.2}
          attenuationColor={accent}
          attenuationDistance={1.6}
        />
      </RoundedBox>

      {/* Inner liquid volume — an opaque tinted core. Because it is opaque it
          sits in the scene that the body glass refracts, so it reads as a full
          flacon of fragrance seen through the glass without a second
          transmission pass or any transparency sorting. */}
      <RoundedBox
        args={[1.24, 1.7, 0.62]}
        radius={0.06}
        smoothness={6}
        position={[0, -0.22, 0]}
      >
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0} />
      </RoundedBox>

      {/* Frosted collar — frosted look comes from high roughness, not
          transmission. */}
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.22, 48]} />
        <meshPhysicalMaterial
          color="#e9e4d8"
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {/* Cap — a distinct sub-group so a later phase can lift it clear. */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.5, 48]} />
        <meshStandardMaterial color="#1b1b1d" roughness={0.35} metalness={0.9} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.4, 0.38, 0.08, 48]} />
        <meshStandardMaterial color={accent} roughness={0.25} metalness={1} />
      </mesh>
    </group>
  );
}
