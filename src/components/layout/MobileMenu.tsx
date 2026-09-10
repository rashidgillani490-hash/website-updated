"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/content";
import { Navigation } from "./Navigation";
import { easeLuxe } from "@/lib/motion/variants";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  settings: SiteSettings;
}

export function MobileMenu({ open, onClose, settings }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-ink lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: easeLuxe }}
        >
          <div className="flex items-center justify-between px-[var(--spacing-gutter)] py-6">
            <Link
              href="/"
              onClick={onClose}
              className="font-serif text-lg tracking-[0.16em] text-ivory"
            >
              {settings.brandName}
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
