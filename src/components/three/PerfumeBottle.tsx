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
}

/**
 * A procedural flacon — no external model. Rounded glass body, frosted collar,
 * metal cap. Kept deliberately architectural so it reads as a brand object
 * rather than a product render.
 */
export function PerfumeBottle({ accent, pointer }: PerfumeBottleProps) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    // Continuous slow turn, plus an eased lean toward the cursor.
    group.current.rotation.y += delta * 0.28;
    group.current.rotation.x = MathUtils.lerp(
      group.current.rotation.x,
      pointer.y * 0.18,
      0.05,
    );
    group.current.position.x = MathUtils.lerp(
      group.current.position.x,
      pointer.x * 0.15,
      0.05,
    );
  });

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      {/* Body */}
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

      {/* Inner liquid volume */}
      <RoundedBox args={[1.24, 1.7, 0.62]} radius={0.06} smoothness={6} position={[0, -0.22, 0]}>
        <meshPhysicalMaterial
          color={accent}
          transmission={0.55}
          thickness={2}
          roughness={0.25}
          ior={1.36}
          attenuationColor={accent}
          attenuationDistance={0.8}
        />
      </RoundedBox>

      {/* Frosted collar */}
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.22, 48]} />
        <meshPhysicalMaterial color="#e9e4d8" roughness={0.85} metalness={0} transmission={0.15} thickness={0.4} />
      </mesh>

      {/* Cap */}
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
