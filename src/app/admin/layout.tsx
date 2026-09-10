import type { Metadata } from "next";
import { contentRepository } from "@/lib/content";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await contentRepository.getSettings();
  return <AdminShell brandName={settings.brandName}>{children}</AdminShell>;
}
