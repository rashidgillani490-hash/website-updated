import type { Variants, Transition } from "motion/react";

/** House easing — a long, settled deceleration. */
export const easeLuxe: Transition["ease"] = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: easeLuxe },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.1, ease: easeLuxe } },
};

/** Parent that releases children one after another. */
export const stagger = (staggerChildren = 0.09, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

/** A line of type that rises from a clipped baseline. */
export const revealLine: Variants = {
  hidden: { y: "110%" },
  visible: {
    y: "0%",
    transition: { duration: 1, ease: easeLuxe },
  },
};

export const viewportOnce = { once: true, margin: "-12% 0px -12% 0px" } as const;
