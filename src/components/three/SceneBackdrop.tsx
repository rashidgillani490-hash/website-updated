"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color, ShaderMaterial } from "three";
import type { StoryPose } from "./story";

interface SceneBackdropProps {
  /** Perfume accent — bled into the hot-spot and kicker at low saturation so
   *  the background and the flacon read as lit by the same source rather
   *  than an object dropped onto an unrelated painting. */
  accent: string;
  /** The same live pose <ScrollDirector> writes into — read here (not
   *  subscribed to) purely to modulate the hot-spot/kicker strength with
   *  `emphasis`, so the backdrop brightens for the same beats the key + rim
   *  lights do. No second scroll system: this is the one shared pose object. */
  pose: React.MutableRefObject<StoryPose>;
}

/*
 * A bright premium studio cyc: warm ivory-white "wall" easing into a soft
 * silver "floor", a gentle hot-spot behind the flacon, and a cool kicker for
 * dimensional interest. Every accent term is MIXED toward its target colour
 * (never added) — the whole thing is built to stay inside the light register
 * by construction; it cannot blow out to a flat white or clip past it, and it
 * cannot slide back toward the old dark/moody palette either.
 * Unlit on purpose: this is the set, not a surface to be lit, so it stays
 * exactly the colour it is authored as regardless of the scene lights.
 * `vDir` is the view-independent direction from the scene origin, so the
 * gradient is stable while the camera dollies/pans.
 */
const VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vDir = normalize(world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec3 vDir;
  uniform vec3 uFloor;
  uniform vec3 uSky;
  uniform vec3 uGlow;
  uniform float uGlowStrength;
  uniform vec3 uKicker;
  uniform float uKickerStrength;

  void main() {
    // Wall: warm ivory-white easing down into a soft warm-silver floor.
    float wall = smoothstep(-0.15, 0.9, vDir.y);
    vec3 col = mix(uFloor, uSky, wall);

    // A gentle floor "shelf" — a photography cyclorama's wall-to-floor seam,
    // not a shadow. Kept subtle and never leaves the light register.
    float shelf = smoothstep(-0.62, -0.30, vDir.y);
    col = mix(col * 0.94, col, shelf);

    // Soft hot-spot behind the flacon, MIXED toward a bright warm highlight
    // (never added) so it reads as a gentle softbox glow and can never clip
    // past white, however far uGlowStrength is pushed.
    float toward = max(dot(vDir, vec3(0.0, 0.0, -1.0)), 0.0);
    float band = 1.0 - smoothstep(0.0, 0.78, abs(vDir.y + 0.05));
    float hotspot = pow(toward, 3.0) * band * uGlowStrength;
    col = mix(col, uGlow, hotspot);

    // A cool, off-axis kicker — the hint of a second studio card, mixed in
    // the same safe way.
    float kickerDir = max(dot(vDir, normalize(vec3(-0.6, 0.12, -0.5))), 0.0);
    float kick = pow(kickerDir, 6.0) * uKickerStrength;
    col = mix(col, uKicker, kick);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Hot-spot/kicker strength lift through the cap + spray (and house-close)
 *  beats — the same restrained proportion the key/rim lights use, so the
 *  backdrop reads as part of one coordinated rig responding to the story. */
const GLOW_BASE = 0.35;
const GLOW_GAIN = 0.25;
const KICKER_BASE = 0.15;
const KICKER_GAIN = 0.15;

/**
 * The cinematic environment behind the flacon — the SOLE visual ground of the
 * cinematic stage. A bright, premium studio cyc (warm ivory wall → soft
 * silver floor, a hot-spot behind the object, a cool kicker for depth)
 * rather than the earlier dark/moody register — deliberately closer to an
 * Apple-product-film or luxury-studio-photography set than a night scene.
 * The bottle stays the visual hero: it is dark glass/metal against a bright
 * field, which is exactly the contrast that makes its edges and reflections
 * read strongly (see PerfumeBottle / SceneEnvironment).
 *
 * Still fully static geometry — no time uniform, no per-frame allocation —
 * so under the canvas's `frameloop="demand"` it costs one draw call per
 * already-requested frame; the one `useFrame` here only writes two existing
 * uniforms, piggybacking on frames the demand loop already runs (no new
 * render trigger). It shares the scene camera, so the existing scroll
 * dolly/pan makes the field recede and shift naturally.
 *
 * `--color-midnight` / `body::before` (globals.css) remain the poster /
 * no-WebGL / not-yet-loaded fallback tone so the swap to WebGL is not a
 * visible pop — this component is what the *active* cinematic scene renders.
 */
export function SceneBackdrop({ accent, pose }: SceneBackdropProps) {
  const material = useMemo(() => {
    // Both pools stay mostly neutral (warm white / cool silver) with only a
    // hint of the perfume accent — enough to feel "the same light", never
    // enough to read as a coloured wash.
    const glow = new Color(accent).lerp(new Color("#fffdf8"), 0.85);
    const kicker = new Color(accent).lerp(new Color("#c7ccd6"), 0.9);
    return new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      side: BackSide,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uFloor: { value: new Color("#dfdcd4") },
        uSky: { value: new Color("#f8f6f2") },
        uGlow: { value: glow },
        uGlowStrength: { value: GLOW_BASE },
        uKicker: { value: kicker },
        uKickerStrength: { value: KICKER_BASE },
      },
    });
  }, [accent]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const emphasis = pose.current.emphasis;
    material.uniforms.uGlowStrength.value = GLOW_BASE + emphasis * GLOW_GAIN;
    material.uniforms.uKickerStrength.value = KICKER_BASE + emphasis * KICKER_GAIN;
  });

  return (
    <mesh
      material={material}
      scale={40}
      frustumCulled={false}
      renderOrder={-1}
    >
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  );
}
