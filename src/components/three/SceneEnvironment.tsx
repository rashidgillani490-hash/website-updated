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
 * Local studio lighting — a four-point rig (key / fill / rim / ambient) plus
 * a reflection-only environment. The bottle is the one dark, richly-coloured
 * object in a now-bright backdrop (see SceneBackdrop), so the priority here
 * isn't "more light everywhere" — it's SHARP, DEFINED highlights: a tighter
 * key cone, a strong rim, and a small bright reflection card sized to throw
 * one crisp glint across the glass, all sitting well above ambient/fill so
 * shadow gradients (and the object's own dark register) still read clearly
 * against the bright field, the classic "dark hero object, bright studio"
 * contrast rather than everything flattening into one even wash.
 *
 * The environment map is generated from the Lightformers below at runtime —
 * no HDR download, so it works offline and inside a strict content-security
 * policy. They are static, so the cubemap is rendered once on mount, not per
 * frame; they only affect reflections (the glass, clearcoat and metal), never
 * direct diffuse/specular shading — that is what the four real lights are for.
 */
export function SceneEnvironment({
  resolution = 256,
  shadowMapSize = 1024,
  castShadow = true,
}: SceneEnvironmentProps) {
  return (
    <>
      {/* Still the contrast lever, held well below key/rim — a bright
          ambient would flatten the glass's transmission and the cap's metal
          highlights into a uniform glow instead of defined specular pops. */}
      <ambientLight intensity={0.42} />

      {/* Key — the dominant light; casts the real-time shadow. Narrowed and
          hardened further (angle 0.34→0.28, penumbra 0.85→0.55) so its
          highlight reads as a sharp, defined pop rather than a soft wash —
          the "brilliant specular edge" the bright register needs. */}
      <spotLight
        name="keyLight"
        position={[5, 6, 4]}
        angle={0.28}
        penumbra={0.55}
        intensity={280}
        castShadow={castShadow}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
      />

      {/* Fill — softens the key's shadow side without erasing it; cooler than
          the key so the two remain visually distinct rather than flattening
          into one wash of light. */}
      <directionalLight position={[-4, 2, -3]} intensity={1.3} color="#b7c0d0" />

      {/* Rim — from behind and above, opposite the key. No shadow (rim lights
          conventionally don't cast one). Against a bright backdrop its job
          shifts from "separate silhouette from black" to "a crisp cool edge
          glint that reads against any ground" — pushed further for that. */}
      <directionalLight
        name="rimLight"
        position={[-3.5, 3.8, -5.5]}
        intensity={6.0}
        color="#eef2fb"
      />

      <Environment resolution={resolution}>
        <Lightformer
          form="rect"
          intensity={3.6}
          position={[0, 3, 2]}
          scale={[6, 3, 1]}
          color="#fff5e6"
        />
        <Lightformer
          form="rect"
          intensity={2.1}
          position={[-4, 1, 1]}
          scale={[3, 4, 1]}
          color="#8892a6"
        />
        <Lightformer
          form="ring"
          intensity={2.1}
          position={[3, -1, 2]}
          scale={[2, 2, 1]}
          color="#ffd9a8"
        />
        {/* Small, bright, tight "beauty card" — the classic product-shot
            trick: a narrow, high-intensity rect sized to throw one crisp
            reflection streak across the glass rather than a broad wash. */}
        <Lightformer
          form="rect"
          intensity={4.5}
          position={[1.6, 2.2, 3]}
          scale={[1, 2.2, 1]}
          color="#ffffff"
        />
        {/* Kept dark on purpose — this is the depth anchor, not "flatness":
            without one deliberately dark reflection, a brighter rig reads as
            an even glow rather than a lit object with real shadow gradients. */}
        <Lightformer
          form="circle"
          intensity={0.5}
          position={[0, -3, -2]}
          scale={[5, 5, 1]}
          color="#16161c"
        />
      </Environment>
    </>
  );
}
