"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal-dialog behaviour for the cart drawer and mobile menu: lock body scroll
 * while open, move focus into the panel, trap Tab within it, close on Escape,
 * and restore focus to the trigger on close.
 *
 * Attach the returned ref to the panel element (the thing that should contain
 * focus — not the backdrop).
 */
export function useDialog<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const ref = useRef<T>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const panel = ref.current;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Focus the first control in the panel (or the panel itself).
    (focusable()[0] ?? panel)?.focus?.();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}
