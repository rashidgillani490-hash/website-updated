"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  CanvasTexture,
  Color,
  NormalBlending,
  ShaderMaterial,
  type Points,
} from "three";
import type { StoryPose } from "./story";

interface SprayParticlesProps {
  /** Scroll-driven pose; `spray` (0..1) is read every frame. Mutated in place. */
  pose: StoryPose;
  /** Hex accent — a light tint on the mist/droplets, never the dominant colour. */
  accent: string;
  /** Total particle budget (from the device quality profile) — split between
   *  the mist and droplet tiers below; the total stays exactly what the
   *  caller asked for. */
  count: number;
  /** Reduced motion: hold a faint static veil instead of an animated plume. */
  reducedMotion?: boolean;
}

/**
 * A radial "bead" sprite — a cool grey-silver body with an offset specular
 * highlight, drawn once to a canvas. This is what makes individual droplets
 * read as small glassy spheres with real form, rather than flat glowing
 * dots — and, critically, its body tones (greys, not white) are what let it
 * actually show up against a bright ivory backdrop under normal (not
 * additive) blending: additive white-on-white is invisible by construction,
 * a cooler, darker-toned sprite is not.
 */
function useDropletSprite(): CanvasTexture {
  const texture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2;
      const body = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      body.addColorStop(0, "rgba(255,255,255,0.95)");
      body.addColorStop(0.22, "rgba(232,236,240,0.88)");
      body.addColorStop(0.5, "rgba(196,203,212,0.6)");
      body.addColorStop(0.78, "rgba(150,159,172,0.28)");
      body.addColorStop(1, "rgba(150,159,172,0)");
      ctx.fillStyle = body;
      ctx.fillRect(0, 0, size, size);

      // Offset specular glint — the classic fake-sphere trick that reads as
      // a refractive highlight on a liquid bead.
      const hx = cx - r * 0.3;
      const hy = cy - r * 0.3;
      const hi = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.32);
      hi.addColorStop(0, "rgba(255,255,255,0.95)");
      hi.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hi;
      ctx.beginPath();
      ctx.arc(hx, hy, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** A soft, low-contrast haze sprite — cool pale grey-blue, wide falloff. This
 *  is the fine volumetric component: many, tiny, cheap, reads as a drifting
 *  density rather than individual specks. */
function useMistSprite(): CanvasTexture {
  const texture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(214,219,226,0.55)");
      g.addColorStop(0.45, "rgba(214,219,226,0.24)");
      g.addColorStop(1, "rgba(214,219,226,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/*
 * Per-particle size and age-based alpha, via a small custom point shader —
 * `pointsMaterial` only supports one scalar size/opacity for the whole
 * cloud, which is what made the old effect read as generic and flat. Size is
 * baked once per particle at spawn (aSize); alpha is written every frame
 * from that particle's own life fraction (aAlpha), so each droplet/mist
 * puff fades in quickly and dissipates gradually on its own timeline instead
 * of the whole cloud stepping opacity in lockstep.
 */
const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (420.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform sampler2D uMap;
  uniform vec3 uTint;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    float a = tex.a * vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(tex.rgb * uTint, a);
  }
`;

const NOZZLE: readonly [number, number, number] = [0, 1.55, 0];
/** Downward acceleration applied to every particle every frame — this is
 *  what turns "decelerate and hang" into an actual rise-arc-fall trajectory,
 *  the single biggest realism gain over a pure-drag model. */
const GRAVITY = 1.55;

interface Tier {
  count: number;
  maxLife: number;
  /** Upward spawn speed range [min, min+span]. */
  speedMin: number;
  speedSpan: number;
  /** Lateral spawn spread (cone half-width, world units). */
  spread: number;
  /** Velocity drag coefficient — higher decays lateral drift faster. */
  drag: number;
  /** Per-frame turbulence amplitude. */
  turbulence: number;
  /** Base sprite size range [min, min+span]. */
  sizeMin: number;
  sizeSpan: number;
  /** How much the sprite shrinks by end of life, 0..1 (0 = constant size). */
  shrink: number;
}

/** Forceful, distinct beads: fast, narrow cone at first, more ballistic
 *  (less drag) so they visibly arc under gravity, shrinking slightly as they
 *  age — evaporating rather than just disappearing. */
const DROPLET: Omit<Tier, "count"> = {
  maxLife: 1.15,
  speedMin: 1.5,
  speedSpan: 1.1,
  spread: 0.16,
  drag: 0.55,
  turbulence: 0.035,
  sizeMin: 0.055,
  sizeSpan: 0.06,
  shrink: 0.35,
};

/** The fine volumetric component: slower, wider, more turbulent, lingers
 *  longer and holds its size — a drifting haze rather than individual specks. */
const MIST: Omit<Tier, "count"> = {
  maxLife: 2.2,
  speedMin: 0.5,
  speedSpan: 0.5,
  spread: 0.3,
  drag: 1.0,
  turbulence: 0.1,
  sizeMin: 0.05,
  sizeSpan: 0.035,
  shrink: 0,
};

/** Particle-array state for one tier, plus the per-frame stepping logic. */
function useTierState(tier: Tier) {
  return useMemo(() => {
    const { count } = tier;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const life = new Float32Array(count);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Start fully aged so the first press spawns them in order, not in a burst.
      life[i] = tier.maxLife + (i / count) * tier.maxLife;
      sizes[i] = tier.sizeMin + Math.random() * tier.sizeSpan;
      const r = Math.random();
      positions[i * 3] = NOZZLE[0] + (Math.random() - 0.5) * tier.spread * r;
      positions[i * 3 + 1] = NOZZLE[1] + r * 1.2;
      positions[i * 3 + 2] = NOZZLE[2] + (Math.random() - 0.5) * tier.spread * r;
    }
    return { positions, velocities, life, sizes, alphas };
  }, [tier]);
}

/**
 * The fragrance-spray scene: two coupled particle tiers — fine drifting mist
 * and forceful, distinct droplets — sharing one physical model (gravity +
 * drag + turbulence) so together they read as a single, forceful atomizer
 * burst rather than a generic puff. Mounted only for the cinematic story
 * (never the detail-page showcase). When `spray` is ~0 both tiers early-out
 * and cost nothing.
 *
 * Rendered with two small custom point shaders (normal, not additive,
 * blending; per-particle size + age-based alpha) instead of the stock
 * `pointsMaterial` — additive white sprites are invisible against the bright
 * studio backdrop by construction (adding white to white does nothing);
 * these carry real, cooler-toned colour in the sprite itself so they show up
 * as genuine grey/silver droplets and haze against a bright field.
 *
 * Positions / velocities / life / size / alpha live in plain typed arrays and
 * are stepped in `useFrame`; nothing here allocates per frame or triggers a
 * React render.
 */
export function SprayParticles({
  pose,
  accent,
  count,
  reducedMotion = false,
}: SprayParticlesProps) {
  const dropletPoints = useRef<Points>(null);
  const mistPoints = useRef<Points>(null);
  const dropletTexture = useDropletSprite();
  const mistTexture = useMistSprite();

  // Droplets get the smaller, more visually distinct share; mist — cheap,
  // numerous — gets the rest. The caller's total budget is preserved exactly.
  const dropletCount = Math.max(6, Math.round(count * 0.3));
  const mistCount = Math.max(6, count - dropletCount);

  const dropletTier = useMemo<Tier>(
    () => ({ ...DROPLET, count: dropletCount }),
    [dropletCount],
  );
  const mistTier = useMemo<Tier>(() => ({ ...MIST, count: mistCount }), [mistCount]);

  const droplets = useTierState(dropletTier);
  const mist = useTierState(mistTier);

  // Near-white with a hint of the perfume's own accent — ties the spray to
  // this specific bottle without it reading as "coloured smoke". Droplets
  // carry a touch more of the accent than the mist (a liquid bead should
  // read closer to the fragrance's own tint than a diffuse haze does).
  const dropletTint = useMemo(
    () => new Color(accent).lerp(new Color("#ffffff"), 0.72),
    [accent],
  );
  const mistTint = useMemo(
    () => new Color(accent).lerp(new Color("#ffffff"), 0.85),
    [accent],
  );

  // Created once and mutated via uniforms thereafter (see the effect below) —
  // the initial `.value`s here are just starting points, not a dependency.
  const dropletMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
        uniforms: {
          uMap: { value: null },
          uTint: { value: new Color("#ffffff") },
          uOpacity: { value: 0 },
        },
      }),
    [],
  );
  const mistMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
        uniforms: {
          uMap: { value: null },
          uTint: { value: new Color("#ffffff") },
          uOpacity: { value: 0 },
        },
      }),
    [],
  );

  // Keep uniforms in sync with the (rare) accent/texture changes without
  // recreating the materials every render.
  useEffect(() => {
    dropletMaterial.uniforms.uMap.value = dropletTexture;
    dropletMaterial.uniforms.uTint.value = dropletTint;
  }, [dropletMaterial, dropletTexture, dropletTint]);
  useEffect(() => {
    mistMaterial.uniforms.uMap.value = mistTexture;
    mistMaterial.uniforms.uTint.value = mistTint;
  }, [mistMaterial, mistTexture, mistTint]);

  useEffect(
    () => () => {
      dropletMaterial.dispose();
      mistMaterial.dispose();
    },
    [dropletMaterial, mistMaterial],
  );

  /** Steps one tier's simulation in place. Returns nothing; mutates arrays
   *  and writes the live buffer attributes directly. */
  const stepTier = (
    tier: Tier,
    state: ReturnType<typeof useTierState>,
    mesh: Points | null,
    material: ShaderMaterial,
    s: number,
    dt: number,
    t: number,
  ) => {
    if (!mesh) return;
    if (s <= 0.002) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    if (reducedMotion) {
      // A held veil: seat the cloud just above the nozzle once, fade by `s`.
      material.uniforms.uOpacity.value = s * 0.5;
      return;
    }

    const { positions, velocities, life, sizes, alphas } = state;
    const posAttr = mesh.geometry.getAttribute("position") as BufferAttribute;
    const alphaAttr = mesh.geometry.getAttribute("aAlpha") as BufferAttribute;
    let spawns = Math.ceil(s * tier.count * dt * 2.4);

    for (let i = 0; i < tier.count; i++) {
      life[i] += dt;
      const alive = life[i] < tier.maxLife;

      if (!alive && spawns > 0) {
        spawns--;
        life[i] = 0;
        const spreadNow = tier.spread * 0.4; // a tight cone at the nozzle
        positions[i * 3] = NOZZLE[0] + (Math.random() - 0.5) * spreadNow;
        positions[i * 3 + 1] = NOZZLE[1];
        positions[i * 3 + 2] = NOZZLE[2] + (Math.random() - 0.5) * spreadNow;
        velocities[i * 3] = (Math.random() - 0.5) * tier.spread;
        velocities[i * 3 + 1] = tier.speedMin + Math.random() * tier.speedSpan;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * tier.spread;
      } else if (life[i] < tier.maxLife) {
        const k = life[i] / tier.maxLife;
        // Gravity — constant downward pull, the arc that makes this a real
        // spray instead of a puff that just stalls in place.
        velocities[i * 3 + 1] -= GRAVITY * dt;
        // Drag opposes motion on every axis; heavier on the lateral axes so
        // the burst narrows back in as it rises, then the fan-out term below
        // widens it again as turbulence takes over.
        velocities[i * 3] *= 1 - tier.drag * dt;
        velocities[i * 3 + 1] *= 1 - tier.drag * 0.35 * dt;
        velocities[i * 3 + 2] *= 1 - tier.drag * dt;

        positions[i * 3] +=
          (velocities[i * 3] + Math.sin(t * 1.7 + i) * tier.turbulence) * dt;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
        positions[i * 3 + 2] +=
          (velocities[i * 3 + 2] + Math.cos(t * 1.7 + i) * tier.turbulence) * dt;
        // Fan outward as it ages — turbulent diffusion, not a rigid jet.
        positions[i * 3] += velocities[i * 3] * k * dt * 0.5;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * k * dt * 0.5;

        // Per-particle fade: quick in, held, gradual dissipation out —
        // independent of every other particle's timeline.
        const fadeIn = Math.min(1, k / 0.08);
        const fadeOut = 1 - Math.min(1, Math.max(0, (k - 0.6) / 0.4));
        alphas[i] = fadeIn * fadeOut;
        sizes[i] =
          (tier.sizeMin + (i % 7) * (tier.sizeSpan / 7)) * (1 - tier.shrink * k);
      } else {
        // Parked off-scene until reused.
        positions[i * 3 + 1] = -999;
        alphas[i] = 0;
      }
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    (mesh.geometry.getAttribute("aSize") as BufferAttribute).needsUpdate = true;
    material.uniforms.uOpacity.value = Math.min(1, s * 1.3);
  };

  useFrame((state, delta) => {
    const s = pose.spray;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    // Each tier's own `s <= 0.002` check inside stepTier() is what actually
    // early-outs (sets visible=false, skips the array walk) — this just
    // supplies the shared clock/delta once per frame instead of twice.
    stepTier(dropletTier, droplets, dropletPoints.current, dropletMaterial, s, dt, t);
    stepTier(mistTier, mist, mistPoints.current, mistMaterial, s, dt, t + 11);
  });

  return (
    <>
      {/* Mist first (behind, in draw order) — the volumetric base the
          droplets punch through. */}
      <points ref={mistPoints} frustumCulled={false} material={mistMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[mist.positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[mist.sizes, 1]} />
          <bufferAttribute attach="attributes-aAlpha" args={[mist.alphas, 1]} />
        </bufferGeometry>
      </points>
      <points ref={dropletPoints} frustumCulled={false} material={dropletMaterial}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[droplets.positions, 3]}
          />
          <bufferAttribute attach="attributes-aSize" args={[droplets.sizes, 1]} />
          <bufferAttribute attach="attributes-aAlpha" args={[droplets.alphas, 1]} />
        </bufferGeometry>
      </points>
    </>
  );
}
