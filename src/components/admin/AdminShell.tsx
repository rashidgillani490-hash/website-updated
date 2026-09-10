import Link from "next/link";
import { AdminNav } from "./AdminNav";

interface AdminShellProps {
  brandName: string;
  children: React.ReactNode;
}

export function AdminShell({ brandName, children }: AdminShellProps) {
  return (
    <div className="min-h-svh bg-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[82rem] items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-lg font-light tracking-[0.14em] text-ivory">
              {brandName}
            </span>
            <span className="text-[0.6rem] uppercase tracking-[var(--tracking-luxe)] text-champagne">
              Admin
            </span>
          </div>
          <Link
            href="/"
            className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:text-ivory"
          >
            View site
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[82rem] gap-12 px-6 py-12 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-12 lg:self-start">
          <AdminNav />
          <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-smoke">
            Phase 1 preview. Screens and forms are in place; the write path and
            authentication arrive in a later phase.
          </p>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
