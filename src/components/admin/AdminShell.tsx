import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { SignOutButton } from "./SignOutButton";

interface AdminShellProps {
  brandName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function AdminShell({ brandName, userEmail, children }: AdminShellProps) {
  return (
    <div className="min-h-svh bg-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[82rem] flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-lg font-light tracking-[0.14em] text-ivory">
              {brandName}
            </span>
            <span className="text-[0.6rem] uppercase tracking-[var(--tracking-luxe)] text-champagne">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-5">
            {userEmail ? (
              <span className="hidden text-xs text-smoke sm:inline">
                {userEmail}
              </span>
            ) : null}
            <Link
              href="/"
              className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:text-ivory"
            >
              View site
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[82rem] gap-12 px-6 py-12 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-12 lg:self-start">
          <AdminNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
