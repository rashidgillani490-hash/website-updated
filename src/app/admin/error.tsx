"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Catch-all for the whole /admin tree (including login). */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-ink px-6 text-center">
      <span className="eyebrow">Admin error</span>
      <h1 className="font-serif text-3xl font-light text-ivory">
        This screen failed to load
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-ivory-dim">
        An unexpected error interrupted the admin area.
      </p>
      {error?.digest ? (
        <p className="text-xs text-smoke">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="border border-line px-5 py-2.5 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="px-5 py-2.5 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:text-ivory"
        >
          Back to admin
        </Link>
      </div>
    </div>
  );
}
