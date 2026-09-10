import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  className?: string;
  as?: "h2" | "h3";
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Reveal>
          <span className="eyebrow flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-champagne/60" />
            {eyebrow}
          </span>
        </Reveal>
      ) : null}
      <Reveal delay={0.05}>
        <Tag className="font-serif text-4xl font-light leading-[1.05] tracking-[-0.01em] text-ivory sm:text-5xl md:text-[3.4rem]">
          {title}
        </Tag>
      </Reveal>
      {intro ? (
        <Reveal delay={0.1}>
          <p
            className={cn(
              "max-w-xl text-[0.95rem] leading-relaxed text-ivory-dim",
              align === "center" && "mx-auto",
            )}
          >
            {intro}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
