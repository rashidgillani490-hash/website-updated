import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Thin wrapper for the whole `/admin` tree. The auth gate + chrome live in
 * `(protected)/layout.tsx` so that `/admin/login` can sit outside them.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
