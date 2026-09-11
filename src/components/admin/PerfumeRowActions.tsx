"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PerfumeAvailability } from "@/lib/content";
import { deletePerfume, patchPerfume } from "@/app/admin/actions";

const AVAILABILITIES: PerfumeAvailability[] = [
  "available",
  "coming-soon",
  "sold-out",
  "archived",
];

interface Props {
  id: string;
  name: string;
  featured: boolean;
  isPublished: boolean;
  availability: PerfumeAvailability;
  isFirst: boolean;
  isLast: boolean;
  order: number;
}

export function PerfumeRowActions({
  id,
  name,
  featured,
  isPublished,
  availability,
  isFirst,
  isLast,
  order,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const run = (patch: Parameters<typeof patchPerfume>[1]) => {
    setError(undefined);
    startTransition(async () => {
      const res = await patchPerfume(id, patch);
      if (!res.ok) setError(res.error ?? "Change failed.");
      else router.refresh();
    });
  };

  const onDelete = () => {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setError(undefined);
    startTransition(async () => {
      const res = await deletePerfume(id);
      if (res && !res.ok) setError(res.error ?? "Delete failed.");
      else router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ isPublished: !isPublished })}
          className={pill(isPublished)}
        >
          {isPublished ? "Published" : "Draft"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ featured: !featured })}
          className={pill(featured)}
        >
          {featured ? "Featured" : "Not featured"}
        </button>
        <select
          aria-label={`${name} availability`}
          disabled={pending}
          value={availability}
          onChange={(e) =>
            run({ availability: e.target.value as PerfumeAvailability })
          }
          className="border border-line bg-ink-800 px-2 py-1 text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim focus:border-champagne focus:outline-none"
        >
          {AVAILABILITIES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || isFirst}
          aria-label="Move up"
          onClick={() => run({ displayOrder: Math.max(0, order - 1) })}
          className="border border-line px-2 py-1 text-[0.65rem] text-ivory-dim hover:border-champagne hover:text-champagne disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={pending || isLast}
          aria-label="Move down"
          onClick={() => run({ displayOrder: order + 1 })}
          className="border border-line px-2 py-1 text-[0.65rem] text-ivory-dim hover:border-champagne hover:text-champagne disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onDelete}
          className="border border-line px-2 py-1 text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim hover:border-red-600 hover:text-red-600 disabled:opacity-30"
        >
          Delete
        </button>
      </div>
      {error ? <span className="text-[0.65rem] text-red-600">{error}</span> : null}
    </div>
  );
}

function pill(on: boolean): string {
  return [
    "border px-2 py-1 text-[0.6rem] uppercase tracking-[var(--tracking-wide)] transition-colors duration-200 disabled:opacity-40",
    on
      ? "border-champagne text-champagne"
      : "border-line text-smoke hover:border-ivory-dim hover:text-ivory-dim",
  ].join(" ");
}
