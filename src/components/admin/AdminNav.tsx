"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Overview", href: "/admin" },
  { label: "Fragrances", href: "/admin/fragrances" },
  { label: "Site settings", href: "/admin/settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "border-l px-4 py-2.5 text-sm transition-colors duration-300",
              active
                ? "border-champagne text-ivory"
                : "border-line text-ivory-dim hover:border-ivory-dim hover:text-ivory",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
