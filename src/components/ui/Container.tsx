import { createElement } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = {
  as?: "div" | "section" | "header" | "footer" | "article";
  bleed?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">;

/**
 * Site-wide horizontal rhythm. `bleed` widens to the outer measure used by
 * full-width editorial rows; the default is the reading measure.
 */
export function Container({
  as = "div",
  bleed = false,
  className,
  children,
  ...rest
}: ContainerProps) {
  return createElement(
    as,
    {
      className: cn(
        "mx-auto w-full px-[var(--spacing-gutter)]",
        bleed ? "max-w-[110rem]" : "max-w-[76rem]",
        className,
      ),
      ...rest,
    },
    children,
  );
}
