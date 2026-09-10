"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteSettings } from "@/lib/content";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/utils";
import { Navigation } from "./Navigation";
import { MobileMenu } from "./MobileMenu";
import { Logo } from "./Logo";
import { CartButton } from "@/components/cart/CartButton";

interface HeaderProps {
  settings: SiteSettings;
}

export function Header({ settings }: HeaderProps) {
  const scrolled = useScrolled(16);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {settings.announcement ? (
        <div className="relative z-40 bg-ink-800 text-center">
          <p className="px-[var(--spacing-gutter)] py-2.5 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim">
            {settings.announcement}
          </p>
        </div>
      ) : null}

      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-500 ease-[var(--ease-out-expo)]",
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
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        settings={settings}
      />
    </>
  );
}
