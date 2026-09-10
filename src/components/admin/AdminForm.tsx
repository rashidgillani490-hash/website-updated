"use client";

import { cn } from "@/lib/utils";

/**
 * Presentational form primitives shared by every Admin screen. They carry no
 * persistence — a later phase wires them to the content repository's write
 * side. For now they are fully controlled inputs with house styling.
 */

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-8 border-b border-line py-10 first:pt-0 lg:grid-cols-[0.32fr_0.68fr]">
      <div>
        <h2 className="font-serif text-xl font-light text-ivory">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke"
      >
        {label}
      </label>
      {children}
      {hint ? <span className="text-xs text-smoke">{hint}</span> : null}
    </div>
  );
}

const controlClass =
  "w-full border border-line bg-ink-800 px-4 py-3 text-sm text-ivory placeholder:text-smoke transition-colors duration-300 focus:border-champagne focus:outline-none";

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(controlClass, "min-h-32 resize-y", className)} {...props} />
  );
}

export function SelectInput({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 sm:grid-cols-2">{children}</div>;
}

export function SubmitBar({
  note = "Saving is disabled in this phase — the Admin write path is built later.",
  actionLabel = "Save changes",
}: {
  note?: string;
  actionLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 mt-4 flex flex-col gap-3 border-t border-line bg-ink/90 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-smoke">{note}</p>
      <button
        type="submit"
        disabled
        className="h-11 shrink-0 bg-ivory px-6 text-[0.7rem] font-medium uppercase tracking-[var(--tracking-wide)] text-ink disabled:opacity-40"
      >
        {actionLabel}
      </button>
    </div>
  );
}
