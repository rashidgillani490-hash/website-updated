"use client";

import { useEffect } from "react";

/** Admin error boundary, rendered inside the AdminShell chrome. */
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
    <div className="flex flex-col gap-5">
      <span className="eyebrow">Error</span>
      <h1 className="font-serif text-3xl font-light text-ivory">
        This screen failed to load
      </h1>
      <p className="max-w-lg text-sm leading-relaxed text-ivory-dim">
        An unexpected error interrupted the admin view.
      </p>
      {error?.digest ? (
        <p className="text-xs text-smoke">Reference: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-2 w-fit border border-line px-5 py-2.5 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne"
      >
        Try again
      </button>
    </div>
  );
}
