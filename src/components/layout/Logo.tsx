import type { SiteSettings } from "@/lib/content";
import { cn } from "@/lib/utils";

interface LogoProps {
  settings: SiteSettings;
  /** Height/utility classes for the image. */
  className?: string;
}

/**
 * The brand logo image, when Site Settings carries a `logoUrl`; otherwise
 * `null` so the caller renders its built-in wordmark. A plain `<img>` is used
 * on purpose — the URL is admin-entered and arbitrary, so it must not go
 * through `next/image`'s host allow-list.
 */
export function Logo({ settings, className }: LogoProps) {
  const src = settings.logoUrl?.trim();
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={settings.brandName}
      className={cn("w-auto object-contain", className)}
    />
  );
}
