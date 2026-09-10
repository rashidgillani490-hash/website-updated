/**
 * Device-tiered render settings for <PerfumeExperience />.
 *
 * Two static profiles rather than runtime auto-scaling: predictable, and the
 * scene is small enough that a good desktop/mobile split is sufficient. Tune
 * these numbers here — nothing else in the 3D code hard-codes quality.
 */

export type PowerPreference = "default" | "high-performance" | "low-power";

export interface QualityProfile {
  /** react-three-fiber dpr clamp: [min, max]. */
  dpr: [number, number];
  /** Real-time shadow mapping for the key light. */
  shadows: boolean;
  /** Key-light shadow map resolution (px, square). */
  shadowMapSize: number;
  /** Runtime environment cubemap resolution. */
  envResolution: number;
  /** <ContactShadows> ground-plane size. */
  contactShadowScale: number;
  /** Bake the contact shadow once instead of every frame. */
  bakeContactShadow: boolean;
  antialias: boolean;
  powerPreference: PowerPreference;
  /** Particle budget for the fragrance-spray scene (cinematic story only). */
  sprayCount: number;
}

const DESKTOP: QualityProfile = {
  dpr: [1, 1.75],
  shadows: true,
  shadowMapSize: 1024,
  envResolution: 256,
  contactShadowScale: 9,
  bakeContactShadow: false,
  antialias: true,
  powerPreference: "high-performance",
  sprayCount: 200,
};

const MOBILE: QualityProfile = {
  dpr: [1, 1.5],
  shadows: false, // ContactShadows alone still grounds the flacon
  shadowMapSize: 512,
  envResolution: 128,
  contactShadowScale: 8,
  bakeContactShadow: true,
  antialias: true,
  powerPreference: "default", // don't force the discrete GPU / drain battery
  sprayCount: 70,
};

export function qualityFor(isMobile: boolean): QualityProfile {
  return isMobile ? MOBILE : DESKTOP;
}
