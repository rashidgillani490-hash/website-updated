import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Thin wrapper for the whole `/admin` tree. The auth gate + chrome live in
 * `(protected)/layout.tsx` so that `/admin/login` can sit outside them.
 *
 * The `admin-theme` class re-points the shared design tokens (ink/ivory/
 * champagne) to a bright palette for this whole subtree — see globals.css.
 * It's applied once here so login and the protected area relight together.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-theme">{children}</div>;
}
