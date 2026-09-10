import { contentRepository } from "@/lib/content";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminShell } from "@/components/admin/AdminShell";

// The admin panel reads the signed-in user's session (cookies) and shows
// drafts — it must never be statically cached.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative server-side gate. Redirects anonymous users and authenticated
  // non-admins to /admin/login. Runs on every admin page load, regardless of
  // the middleware.
  const { user } = await requireAdmin();
  const settings = await contentRepository.getSettings();

  return (
    <AdminShell brandName={settings.brandName} userEmail={user.email ?? ""}>
      {children}
    </AdminShell>
  );
}
