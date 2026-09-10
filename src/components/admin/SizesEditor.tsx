"use client";

export interface SizeRow {
  ml: string;
  price: string;
  /** Blank = stock not tracked; a number = tracked + decremented on checkout. */
  stock: string;
}

interface SizesEditorProps {
  value: SizeRow[];
  onChange: (rows: SizeRow[]) => void;
  error?: string;
}

const control =
  "w-full border border-line bg-ink-800 px-3 py-2 text-sm text-ivory placeholder:text-smoke focus:border-champagne focus:outline-none";

/**
 * The multi-size model (50 ml, 100 ml …). Kept as an ordered list — row order
 * is the display order. Values are strings while editing; the form coerces and
 * validates (`ml > 0`, `price >= 0`) on save.
 */
export function SizesEditor({ value, onChange, error }: SizesEditorProps) {
  const update = (i: number, patch: Partial<SizeRow>) =>
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {value.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2">
              <input
                aria-label={`Size ${i + 1} millilitres`}
                inputMode="numeric"
                className={control}
                placeholder="ml"
                value={row.ml}
                onChange={(e) => update(i, { ml: e.target.value })}
              />
              <span className="text-xs text-smoke">ml</span>
              <input
                aria-label={`Size ${i + 1} price`}
                inputMode="decimal"
                className={control}
                placeholder="price"
                value={row.price}
                onChange={(e) => update(i, { price: e.target.value })}
              />
              <input
                aria-label={`Size ${i + 1} stock`}
                inputMode="numeric"
                className={control}
                placeholder="stock (∞)"
                title="Leave blank to not track stock for this size"
                value={row.stock}
                onChange={(e) => update(i, { stock: e.target.value })}
              />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move size up"
                className="border border-line px-2 py-2 text-xs text-ivory-dim hover:border-champagne hover:text-champagne disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label="Move size down"
                className="border border-line px-2 py-2 text-xs text-ivory-dim hover:border-champagne hover:text-champagne disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                disabled={value.length <= 1}
                aria-label="Remove size"
                className="border border-line px-2 py-2 text-xs text-ivory-dim hover:border-red-400 hover:text-red-400 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {error ? <span className="text-xs text-red-400">{error}</span> : null}

      <p className="text-xs text-smoke">
        Stock is optional — leave it blank to keep a size always available. A
        number is decremented at checkout and cannot go below zero.
      </p>

      <button
        type="button"
        onClick={() => onChange([...value, { ml: "", price: "", stock: "" }])}
        className="w-fit border border-line px-4 py-2 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne"
      >
        Add size
      </button>
    </div>
  );
}
