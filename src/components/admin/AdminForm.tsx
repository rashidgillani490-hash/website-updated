"use client";

import { cn } from "@/lib/utils";

/** Presentational form primitives shared by every Admin screen. */

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
  error,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  error?: string;
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
      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-smoke">{hint}</span>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full border border-line bg-ink-800 px-4 py-3 text-sm text-ivory placeholder:text-smoke transition-colors duration-300 focus:border-champagne focus:outline-none disabled:opacity-50";

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
    <textarea
      className={cn(controlClass, "min-h-32 resize-y", className)}
      {...props}
    />
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

export function Checkbox({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex h-11 items-center gap-3 text-sm text-ivory-dim">
      <input
        type="checkbox"
        className="h-4 w-4 accent-champagne"
        {...props}
      />
      {label}
    </label>
  );
}

/**
 * Sticky save bar with a live status line. The parent owns the submit — the
 * bar just reflects `pending` / `error` / `saved`, and enables the button only
 * when there is something to save.
 */
export function SubmitBar({
  pending = false,
  dirty = true,
  error,
  saved = false,
  actionLabel = "Save changes",
}: {
  pending?: boolean;
  dirty?: boolean;
  error?: string;
  saved?: boolean;
  actionLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 mt-4 flex flex-col gap-3 border-t border-line bg-ink/90 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs" aria-live="polite">
        {error ? (
          <span className="text-red-400">{error}</span>
        ) : pending ? (
          <span className="text-smoke">Saving…</span>
        ) : saved ? (
          <span className="text-green-400">Saved.</span>
        ) : dirty ? (
          <span className="text-smoke">Unsaved changes</span>
        ) : (
          <span className="text-smoke">All changes saved</span>
        )}
      </p>
      <button
        type="submit"
        disabled={pending || !dirty}
        className="h-11 shrink-0 bg-ivory px-6 text-[0.7rem] font-medium uppercase tracking-[var(--tracking-wide)] text-ink transition-colors duration-300 hover:bg-champagne-bright disabled:opacity-40"
      >
        {pending ? "Saving…" : actionLabel}
      </button>
    </div>
  );
}
