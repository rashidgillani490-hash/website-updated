"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Storefront error boundary. Rendered inside the (site) layout, so the Header
 * and Footer stay in place around it.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for logging/observability wiring in a later phase.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="eyebrow">Something went wrong</span>
      <h1 className="font-serif text-4xl font-light text-ivory sm:text-5xl">
        This page didn&apos;t settle
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-ivory-dim">
        An unexpected error interrupted the page. You can try again, or return to
        familiar ground.
      </p>
      {error?.digest ? (
        <p className="text-xs text-smoke">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="border border-line px-6 py-3 text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-ivory transition-colors duration-500 hover:border-champagne hover:text-champagne"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-500 hover:text-ivory"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
