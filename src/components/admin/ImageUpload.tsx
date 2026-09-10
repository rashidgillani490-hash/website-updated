"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  /** Existing image path to show as the current value. */
  currentSrc?: string;
  currentAlt?: string;
}

/**
 * Image field UI: drag-and-drop or browse, with a local preview. It does not
 * upload anything yet — the storage adapter is added in a later phase — so a
 * chosen file is previewed via an object URL only.
 */
export function ImageUpload({ label, currentSrc, currentAlt }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const accept = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
  }, []);

  const shown = preview ?? currentSrc;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
        {label}
      </span>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex flex-col gap-4 border border-dashed p-4 transition-colors duration-300 sm:flex-row sm:items-center",
          dragging ? "border-champagne bg-ink-700" : "border-line bg-ink-800",
        )}
      >
        <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-ink-700">
          {shown ? (
            <Image
              src={shown}
              alt={currentAlt ?? "Selected image preview"}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized={Boolean(preview)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
              None
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-ivory-dim">
            {fileName ? (
              <>Selected: <span className="text-ivory">{fileName}</span></>
            ) : (
              "Drop an image here, or browse."
            )}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-fit border border-line px-4 py-2 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => accept(e.target.files?.[0])}
          />
        </div>
      </div>
    </div>
  );
}
