import type { Metadata } from "next";
import Link from "next/link";

// Override the site-wide `index, follow` from the root layout so a 404 never
// advertises itself as indexable. (Next also injects its own `noindex` for
// not-found responses; a second, identical directive is harmless.)
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="eyebrow">Error 404</span>
      <h1 className="font-serif text-4xl font-light text-ivory sm:text-5xl">
        This page has evaporated
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-ivory-dim">
        The address you followed doesn&apos;t lead anywhere in the maison.
      </p>
      <Link
        href="/"
        className="mt-2 border border-line px-6 py-3 text-[0.7rem] uppercase tracking-[var(--tracking-wide)] text-ivory transition-colors duration-500 hover:border-champagne hover:text-champagne"
      >
        Return home
      </Link>
    </div>
  );
}
