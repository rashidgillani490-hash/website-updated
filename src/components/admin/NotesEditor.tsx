"use client";

import type { NoteTier } from "@/lib/content";

export interface NoteRow {
  name: string;
  tier: NoteTier;
  description: string;
}

interface NotesEditorProps {
  value: NoteRow[];
  onChange: (rows: NoteRow[]) => void;
  error?: string;
}

const TIERS: { key: NoteTier; label: string }[] = [
  { key: "top", label: "Top notes" },
  { key: "heart", label: "Heart notes" },
  { key: "base", label: "Base notes" },
];

const control =
  "w-full border border-line bg-ink-800 px-3 py-2 text-sm text-ivory placeholder:text-smoke focus:border-champagne focus:outline-none";

/**
 * The olfactive pyramid. Notes are one flat list on the domain model; here they
 * are grouped by tier for editing. Order within a tier is the row order; the
 * form flattens back to a single ordered array on save.
 */
export function NotesEditor({ value, onChange, error }: NotesEditorProps) {
  // Stable index into the flat array so edits target the right row.
  const withIndex = value.map((note, index) => ({ note, index }));

  const update = (index: number, patch: Partial<NoteRow>) =>
    onChange(value.map((n, i) => (i === index ? { ...n, ...patch } : n)));

  const remove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const add = (tier: NoteTier) =>
    onChange([...value, { name: "", tier, description: "" }]);

  const move = (index: number, dir: -1 | 1) => {
    const tier = value[index].tier;
    const siblings = withIndex.filter((x) => x.note.tier === tier);
    const pos = siblings.findIndex((x) => x.index === index);
    const swapWith = siblings[pos + dir];
    if (!swapWith) return;
    const next = [...value];
    [next[index], next[swapWith.index]] = [next[swapWith.index], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-6">
      {TIERS.map((tier) => {
        const rows = withIndex.filter((x) => x.note.tier === tier.key);
        return (
          <div key={tier.key} className="flex flex-col gap-2">
            <span className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-champagne">
              {tier.label}
            </span>
            {rows.length === 0 ? (
              <p className="text-xs text-smoke">No notes yet.</p>
            ) : null}
            {rows.map(({ note, index }, pos) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <input
                    aria-label={`${tier.label} name`}
                    className={`${control} sm:w-40`}
                    placeholder="Note"
                    value={note.name}
                    onChange={(e) => update(index, { name: e.target.value })}
                  />
                  <input
                    aria-label={`${tier.label} description`}
                    className={control}
                    placeholder="One-line evocation (optional)"
                    value={note.description}
                    onChange={(e) =>
                      update(index, { description: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={pos === 0}
                    aria-label="Move note up"
                    className="border border-line px-2 py-2 text-xs text-ivory-dim hover:border-champagne hover:text-champagne disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={pos === rows.length - 1}
                    aria-label="Move note down"
                    className="border border-line px-2 py-2 text-xs text-ivory-dim hover:border-champagne hover:text-champagne disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove note"
                    className="border border-line px-2 py-2 text-xs text-ivory-dim hover:border-red-600 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => add(tier.key)}
              className="w-fit border border-line px-4 py-2 text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne"
            >
              Add {tier.label.toLowerCase().replace(" notes", "")} note
            </button>
          </div>
        );
      })}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
