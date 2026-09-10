import Link from "next/link";
import { FragranceForm } from "@/components/admin/FragranceForm";

export default function NewFragrancePage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/fragrances"
          className="text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke transition-colors duration-300 hover:text-ivory"
        >
          ← Fragrances
        </Link>
        <h1 className="font-serif text-3xl font-light text-ivory">
          New fragrance
        </h1>
      </header>
      <FragranceForm />
    </div>
  );
}
