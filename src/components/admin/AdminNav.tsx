"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Overview", href: "/admin", exact: true },
  { label: "Website settings", href: "/admin/settings" },
  { label: "Perfumes", href: "/admin/fragrances", notMatch: "/admin/fragrances/new" },
  { label: "Add perfume", href: "/admin/fragrances/new" },
];

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (link: (typeof LINKS)[number]) => {
    if (link.exact) return pathname === link.href;
    if (link.notMatch && pathname === link.notMatch) return false;
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  };

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "border-l px-4 py-2.5 text-sm transition-colors duration-300",
            isActive(link)
              ? "border-champagne text-ivory"
              : "border-line text-ivory-dim hover:border-ivory-dim hover:text-ivory",
          )}
        >
          {link.label}
        </Link>
      ))}
      <span
        aria-disabled
        title="Orders arrive with the checkout phase"
        className="mt-1 cursor-default border-l border-line px-4 py-2.5 text-sm text-smoke/60"
      >
        Orders
        <span className="ml-2 text-[0.55rem] uppercase tracking-[var(--tracking-wide)]">
          soon
        </span>
      </span>
    </nav>
  );
}
