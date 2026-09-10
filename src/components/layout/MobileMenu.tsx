"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/content";
import { useDialog } from "@/hooks/useDialog";
import { Navigation } from "./Navigation";
import { Logo } from "./Logo";
import { easeLuxe } from "@/lib/motion/variants";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  settings: SiteSettings;
}

export function MobileMenu({ open, onClose, settings }: MobileMenuProps) {
  const panelRef = useDialog<HTMLDivElement>(open, onClose);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex flex-col bg-ink outline-none lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: easeLuxe }}
        >
          <div className="flex items-center justify-between px-[var(--spacing-gutter)] py-6">
            <Link
              href="/"
              onClick={onClose}
              aria-label={settings.brandName}
              className="font-serif text-lg tracking-[0.16em] text-ivory"
            >
              {settings.logoUrl ? (
                <Logo settings={settings} className="h-7" />
              ) : (
                settings.brandName
              )}
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim hover:text-ivory"
            >
              Close
            </button>
          </div>

          <motion.div
            className="flex flex-1 flex-col justify-between px-[var(--spacing-gutter)] pb-12 pt-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6, ease: easeLuxe }}
          >
            <Navigation
              links={settings.primaryNav}
              orientation="vertical"
              onNavigate={onClose}
            />
            <div className="flex flex-col gap-2 text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
              <span>{settings.contactEmail}</span>
              <span>{settings.addressLines.join(", ")}</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
