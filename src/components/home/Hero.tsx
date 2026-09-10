import { PerfumeExperience } from "@/components/three/PerfumeExperience";
import { ButtonLink } from "@/components/ui/Button";

interface HeroProps {
  eyebrow: string;
  titleLines: string[];
  intro: string;
  accent: string;
  poster: string;
  posterAlt: string;
}

/**
 * Opening frame: a clipped-line serif headline against the live 3D flacon.
 * The headline reveals on mount via CSS (`hero-reveal*` classes in
 * globals.css), staggered with inline `animation-delay`. Kept off the JS
 * animation library here so hydration timing can't leave it stuck and so it
 * can't interfere with the on-scroll reveals lower on the page.
 */
export function Hero({
  eyebrow,
  titleLines,
  intro,
  accent,
  poster,
  posterAlt,
}: HeroProps) {
  return (
    <section className="relative min-h-[calc(100svh-3.5rem)] overflow-hidden">
      {/* Scene layer */}
      <div className="pointer-events-none absolute inset-0 lg:left-[38%]">
        <div className="pointer-events-auto h-full w-full">
          <PerfumeExperience
            accent={accent}
            poster={poster}
            posterAlt={posterAlt}
            priorityPoster
          />
        </div>
      </div>

      {/* Left-to-right scrim so type stays legible over the scene */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(100deg,var(--color-ink)_18%,rgba(10,10,11,0.6)_46%,transparent_72%)]"
      />

      <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-[110rem] flex-col justify-center px-[var(--spacing-gutter)] py-24">
        <div className="max-w-2xl">
          <span
            className="hero-reveal--fade eyebrow flex items-center gap-3"
            style={{ animationDelay: "0.15s" }}
          >
            <span aria-hidden className="h-px w-10 bg-champagne/60" />
            {eyebrow}
          </span>

          <h1 className="mt-7 font-serif text-[clamp(2.75rem,7vw,5.25rem)] font-light leading-[0.98] tracking-[-0.015em] text-ivory">
            {titleLines.map((line, i) => (
              <span key={i} className="block overflow-hidden">
                <span
                  className="hero-reveal--line"
                  style={{ animationDelay: `${0.27 + i * 0.12}s` }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p
            className="hero-reveal mt-8 max-w-md text-[0.98rem] leading-relaxed text-ivory-dim"
            style={{ animationDelay: "0.55s" }}
          >
            {intro}
          </p>

          <div
            className="hero-reveal mt-11 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.66s" }}
          >
            <ButtonLink href="/collection" variant="solid">
              Discover the collection
            </ButtonLink>
            <ButtonLink href="/#house" variant="ghost">
              The house
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Scroll cue — CSS fade in, then a CSS-driven "breath" on the line
          (composited off the main thread, silenced by prefers-reduced-motion). */}
      <div
        className="hero-reveal--fade absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
        style={{ animationDelay: "1.4s" }}
      >
        <span className="text-[0.6rem] uppercase tracking-[var(--tracking-luxe)] text-smoke">
          Scroll
        </span>
        <span
          aria-hidden
          className="scroll-cue-line h-10 w-px bg-gradient-to-b from-champagne/70 to-transparent"
        />
      </div>
    </section>
  );
}
