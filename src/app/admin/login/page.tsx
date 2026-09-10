import { redirect } from "next/navigation";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAdminSession } from "@/lib/auth/require-admin";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // Already signed in as an admin? Skip the form.
  if (await getAdminSession()) redirect("/admin");

  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-svh items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <span className="font-serif text-2xl font-light tracking-[0.14em] text-ivory">
            Maison Lumière
          </span>
          <span className="text-[0.6rem] uppercase tracking-[var(--tracking-luxe)] text-champagne">
            Admin
          </span>
        </div>

        {configured ? (
          <LoginForm />
        ) : (
          <p className="border border-line bg-ink-800 p-6 text-sm leading-relaxed text-ivory-dim">
            The admin area is not configured on this deployment. Set
            <span className="text-ivory"> NEXT_PUBLIC_SUPABASE_URL </span>
            and
            <span className="text-ivory"> NEXT_PUBLIC_SUPABASE_ANON_KEY </span>
            and run the Supabase migrations.
          </p>
        )}

        <Link
          href="/"
          className="mt-8 block text-center text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke transition-colors duration-300 hover:text-ivory"
        >
          Back to site
        </Link>
      </div>
    </div>
  );
}
