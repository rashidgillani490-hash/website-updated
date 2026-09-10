"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@/lib/content";
import { cn } from "@/lib/utils";

interface NavigationProps {
  links: NavLink[];
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
  className?: string;
}

/**
 * Primary navigation, shared by the desktop header and the mobile menu.
 * Marks the active route and, for hash links, the section's parent route.
 */
export function Navigation({
  links,
  orientation = "horizontal",
  onNavigate,
  className,
}: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        orientation === "horizontal"
          ? "flex items-center gap-9"
          : "flex flex-col gap-6",
        className,
      )}
    >
      {links.map((link) => {
        const routePart = link.href.split("#")[0] || "/";
        const active =
          routePart === "/"
            ? pathname === "/" && link.href === "/"
            : pathname === routePart || pathname.startsWith(`${routePart}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "group relative font-sans uppercase tracking-[var(--tracking-wide)] transition-colors duration-500",
              orientation === "horizontal"
                ? "text-[0.7rem]"
                : "text-lg tracking-[0.12em]",
              active ? "text-ivory" : "text-ivory-dim hover:text-ivory",
            )}
          >
            {link.label}
            <span
              aria-hidden
              className={cn(
                "absolute -bottom-1.5 left-0 h-px bg-champagne transition-all duration-500 ease-[var(--ease-out-expo)]",
                active ? "w-full" : "w-0 group-hover:w-full",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
