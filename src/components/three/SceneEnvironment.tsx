"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Local studio lighting. The environment map is generated from these
 * Lightformers at runtime — no HDR download, so it works offline and inside
 * a strict content-security policy.
 */
export function SceneEnvironment() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <spotLight
        position={[5, 6, 4]}
        angle={0.4}
        penumbra={1}
        intensity={140}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#b7c0d0" />

      <Environment resolution={256}>
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
