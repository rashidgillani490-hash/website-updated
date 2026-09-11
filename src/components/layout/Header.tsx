"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import type { SiteSettings } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Navigation } from "./Navigation";
import { MobileMenu } from "./MobileMenu";
import { Logo } from "./Logo";
import { CartButton } from "@/components/cart/CartButton";

interface HeaderProps {
  settings: SiteSettings;
}

/** Scroll distance (px) over which the header recedes on the cinematic home
 *  route — comfortably inside the hero beat of <CinematicPerfumeStory>, so
 *  it is gone well before the story reaches the object/cap/spray beats. */
const CINEMA_FADE_RANGE = 240;

/**
 * The site header. On every route it keeps its existing behaviour: sticky,
 * gaining a blurred backdrop once the page has scrolled a little.
 *
 * On the cinematic home route ONLY, it additionally recedes — fades and lifts
 * a few px — as the user scrolls into the story, and restores on the way back
 * up, so it stops occupying the stage instead of permanently overlapping the
 * hero title and the flacon at `z-40`. This is gated on `pathname === "/"`
 * (the same "don't leak into unrelated pages" precedent as `PerfumeCanvas`'s
 * own `story === "cinematic"` gate) — collection/cart/checkout/detail pages
 * are entirely unaffected.
 *
 * Both behaviours read from ONE `useScroll()` subscription — Motion's shared,
 * passive scroll tracking (the same mechanism `CinematicPerfumeStory` uses),
 * not a second listener. The old boolean `useScrolled` hook is retired.
 */
export function Header({ settings }: HeaderProps) {
  const pathname = usePathname();
  const isCinematicHome = pathname === "/";
  const reduce = useReducedMotion() ?? false;

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cinemaHidden, setCinemaHidden] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 16));

  // Direct maps of scroll position — no spring/duration here, so this isn't
  // "motion" in the reduced-motion sense; it's the same "opacity still tracks
  // scroll" contract the cinematic story itself uses. Only the translate is
  // held at 0 under reduced motion, matching that same convention.
  const cinemaOpacity = useTransform(scrollY, [0, CINEMA_FADE_RANGE], [1, 0]);
  const cinemaY = useTransform(
    scrollY,
    [0, CINEMA_FADE_RANGE],
    reduce ? [0, 0] : [0, -20],
  );
  useMotionValueEvent(cinemaOpacity, "change", (v) => {
    if (isCinematicHome) setCinemaHidden(v < 0.05);
  });

  // Fully receded: remove from the accessibility tree, tab order and pointer
  // hit-testing without unmounting it — restores automatically once visible.
  const hideForCinema = isCinematicHome && cinemaHidden;

  return (
    <>
      {settings.announcement ? (
        <div className="relative z-40 bg-ink-800 text-center">
          <p className="px-[var(--spacing-gutter)] py-2.5 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim">
            {settings.announcement}
          </p>
        </div>
      ) : null}

      <motion.header
        style={isCinematicHome ? { opacity: cinemaOpacity, y: cinemaY } : undefined}
        inert={hideForCinema}
        className={cn(
          "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ease-[var(--ease-out-expo)]",
          scrolled
            ? "border-b border-line/70 bg-ink/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-[110rem] items-center justify-between px-[var(--spacing-gutter)] py-5">
          <Link href="/" className="flex flex-col leading-none" aria-label={settings.brandName}>
            {settings.logoUrl ? (
              <Logo settings={settings} className="h-8" />
            ) : (
              <>
                <span className="font-serif text-xl font-light tracking-[0.18em] text-ivory">
                  {settings.brandName}
                </span>
                <span className="mt-1 text-[0.55rem] uppercase tracking-[var(--tracking-luxe)] text-smoke">
                  {settings.tagline}
                </span>
              </>
            )}
          </Link>

          <div className="hidden lg:block">
            <Navigation links={settings.primaryNav} />
          </div>

          <div className="flex items-center gap-5 sm:gap-6">
            <Link
              href="/collection"
              className="hidden text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-500 hover:text-ivory sm:block"
            >
              Shop
            </Link>
            <CartButton />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-8 w-8 items-center justify-center lg:hidden"
            >
              <span className="relative block h-2.5 w-6">
                <span className="absolute left-0 top-0 h-px w-full bg-ivory" />
                <span className="absolute bottom-0 left-0 h-px w-full bg-ivory" />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        settings={settings}
      />
    </>
  );
}
