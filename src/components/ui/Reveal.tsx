"use client";

import { motion, type Variants } from "motion/react";
import { fadeUp, viewportOnce } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds to hold before the animation starts. */
  delay?: number;
  variants?: Variants;
  as?: "div" | "section" | "li" | "span";
}

/**
 * Scroll-into-view reveal. Wraps any block so it rises and fades once, the
 * first time it enters the viewport. Respects reduced-motion via the global
 * CSS override.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variants = fadeUp,
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
