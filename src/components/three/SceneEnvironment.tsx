"use client";

import { Environment, Lightformer } from "@react-three/drei";

interface SceneEnvironmentProps {
  /** Runtime environment cubemap resolution. Lower on constrained devices. */
  resolution?: number;
  /** Key-light shadow map resolution (square). */
  shadowMapSize?: number;
  /** Whether the key light casts real-time shadows. */
  castShadow?: boolean;
}

/**
 * Local studio lighting. The environment map is generated from these
 * Lightformers at runtime — no HDR download, so it works offline and inside
 * a strict content-security policy. The Lightformers are static, so the
 * cubemap is rendered once on mount, not per frame.
 */
export function SceneEnvironment({
  resolution = 256,
  shadowMapSize = 1024,
  castShadow = true,
}: SceneEnvironmentProps) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <spotLight
        position={[5, 6, 4]}
        angle={0.4}
        penumbra={1}
        intensity={140}
        castShadow={castShadow}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
      />
      <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#b7c0d0" />

      <Environment resolution={resolution}>
        <Lightformer
          form="rect"
          intensity={2.4}
          position={[0, 3, 2]}
          scale={[6, 3, 1]}
          color="#fff5e6"
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[-4, 1, 1]}
          scale={[3, 4, 1]}
          color="#8892a6"
        />
        <Lightformer
          form="ring"
          intensity={1.6}
          position={[3, -1, 2]}
          scale={[2, 2, 1]}
          color="#ffd9a8"
        />
        <Lightformer
          form="circle"
          intensity={0.8}
          position={[0, -3, -2]}
          scale={[5, 5, 1]}
          color="#20202a"
        />
      </Environment>
    </>
  );
}
