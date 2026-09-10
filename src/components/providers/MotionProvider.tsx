"use client";

import { MotionConfig } from "motion/react";

/**
 * App-wide Motion defaults.
 *
 * `reducedMotion="user"` makes every `motion` component honour the OS
 * "reduce motion" setting — transform and layout animations are dropped
 * (opacity still animates) without any per-component code. This is what the
 * global CSS `prefers-reduced-motion` block cannot do on its own, because
 * Motion drives its animations via rAF/WAAPI rather than CSS transitions.
 *
 * Easing is deliberately not set here — components use the house curve
 * (`easeLuxe` in `lib/motion/variants`, mirrored by `--ease-out-expo` in CSS).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
