import Link from "next/link";
import type { SiteSettings } from "@/lib/content";
import { Container } from "@/components/ui/Container";

interface FooterProps {
  settings: SiteSettings;
}

export function Footer({ settings }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line/70 bg-ink-800">
      <Container bleed className="py-20">
        <div className="grid gap-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-5">
            <span className="font-serif text-2xl font-light tracking-[0.16em] text-ivory">
              {settings.brandName}
            </span>
            <p className="max-w-sm text-sm leading-relaxed text-ivory-dim">
              {settings.description}
            </p>
            <address className="mt-2 flex flex-col gap-0.5 text-[0.7rem] uppercase not-italic tracking-[var(--tracking-wide)] text-smoke">
              {settings.addressLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3">
            <span className="eyebrow mb-2">Explore</span>
            {settings.footerNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ivory-dim transition-colors duration-500 hover:text-ivory"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <span className="eyebrow mb-2">Contact</span>
            <a
              href={`mailto:${settings.contactEmail}`}
              className="text-sm text-ivory-dim transition-colors duration-500 hover:text-ivory"
            >
              {settings.contactEmail}
            </a>
            <div className="mt-4 flex flex-col gap-3">
              {settings.social.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-ivory-dim transition-colors duration-500 hover:text-ivory"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line/60 pt-8 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {year} {settings.brandName}. All rights reserved.
          </span>
          <span>Made in France</span>
        </div>
      </Container>
    </footer>
  );
}
