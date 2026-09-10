import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 font-sans text-[0.7rem] font-medium uppercase tracking-[var(--tracking-wide)] transition-colors duration-500 ease-[var(--ease-out-expo)] disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  solid: "bg-ivory text-ink hover:bg-champagne-bright",
  outline:
    "border border-line text-ivory hover:border-champagne hover:text-champagne",
  ghost: "text-ivory-dim hover:text-ivory",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4",
  md: "h-12 px-7",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

function buttonClasses({ variant = "solid", size = "md", className }: StyleProps) {
  return cn(base, variants[variant], sizes[size], className);
}

type LinkProps = StyleProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, keyof StyleProps>;

export function ButtonLink({ variant, size, className, ...rest }: LinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...rest} />;
}

type ButtonProps = StyleProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof StyleProps>;

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    />
  );
}
