"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { AdminImage } from "@/lib/admin/repository";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LABEL,
} from "@/lib/admin/image-constants";
import { resolveImagePath } from "@/lib/content/db-mappers";
import {
  deleteImage,
  reorderImages,
  updateImageAlt,
  uploadImage,
} from "@/app/admin/actions";

interface PerfumeImagesProps {
  perfumeId: string;
  slug: string;
  images: AdminImage[];
}

function clientValidate(file: File): string | null {
  if (!file || file.size === 0) return "Choose an image file.";
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Use a JPEG, PNG, WebP or AVIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) return `Image must be ${MAX_IMAGE_LABEL} or smaller.`;
  return null;
}

export function PerfumeImages({ perfumeId, slug, images }: PerfumeImagesProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const heroInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const hero = images.find((i) => i.role === "hero") ?? null;
  const gallery = images
    .filter((i) => i.role === "gallery")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const run = (task: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      else router.refresh();
    });
  };

  const onPick =
    (role: "hero" | "gallery") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const message = clientValidate(file);
      if (message) {
        setError(message);
        return;
      }
      const fd = new FormData();
      fd.set("perfumeId", perfumeId);
      fd.set("slug", slug);
      fd.set("role", role);
      fd.set("alt", "");
      fd.set("file", file);
      run(() => uploadImage(fd));
    };

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {/* Hero -------------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <span className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-champagne">
          Hero image
        </span>
        <div className="flex items-start gap-4">
          <div className="relative h-28 w-24 shrink-0 overflow-hidden border border-line bg-ink-700">
            {hero ? (
              <Image
                src={resolveImagePath(hero.path)}
                alt={hero.alt || "Hero image"}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke">
                None
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => heroInput.current?.click()}
              className="w-fit border border-line px-4 py-2 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne disabled:opacity-40"
            >
              {hero ? "Replace hero" : "Upload hero"}
            </button>
            {hero ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteImage(perfumeId, hero.id))}
                className="w-fit text-[0.6rem] uppercase tracking-[var(--tracking-wide)] text-smoke transition-colors duration-300 hover:text-red-400 disabled:opacity-40"
              >
                Remove
              </button>
            ) : null}
            <input
              ref={heroInput}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={onPick("hero")}
            />
          </div>
        </div>
      </div>

      {/* Gallery -------------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <span className="text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-champagne">
          Gallery ({gallery.length})
        </span>
        <div className="flex flex-col gap-3">
          {gallery.map((img, i) => (
            <div
              key={img.id}
              className="flex items-start gap-3 border border-line bg-ink-800 p-3"
            >
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-ink-700">
                <Image
                  src={resolveImagePath(img.path)}
                  alt={img.alt || "Gallery image"}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <input
                  aria-label={`Gallery image ${i + 1} description`}
                  defaultValue={img.alt}
                  placeholder="Description (alt text)"
                  className="w-full border border-line bg-ink px-3 py-2 text-sm text-ivory placeholder:text-smoke focus:border-champagne focus:outline-none"
                  onBlur={(e) => {
                    if (e.target.value !== img.alt) {
                      run(() =>
                        updateImageAlt(perfumeId, img.id, e.target.value),
                      );
                    }
                  }}
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={pending || i === 0}
                    aria-label="Move image up"
                    onClick={() =>
                      run(() =>
                        reorderImages(
                          perfumeId,
                          swap(gallery.map((g) => g.id), i, i - 1),
                        ),
                      )
                    }
                    className="border border-line px-2 py-1 text-xs text-ivory-dim hover:border-champagne hover:text-champagne disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={pending || i === gallery.length - 1}
                    aria-label="Move image down"
                    onClick={() =>
                      run(() =>
                        reorderImages(
                          perfumeId,
                          swap(gallery.map((g) => g.id), i, i + 1),
                        ),
                      )
                    }
                    className="border border-line px-2 py-1 text-xs text-ivory-dim hover:border-champagne hover:text-champagne disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    aria-label="Delete image"
                    onClick={() => run(() => deleteImage(perfumeId, img.id))}
                    className="border border-line px-2 py-1 text-xs text-ivory-dim hover:border-red-400 hover:text-red-400 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => galleryInput.current?.click()}
          className="w-fit border border-line px-4 py-2 text-[0.65rem] uppercase tracking-[var(--tracking-wide)] text-ivory-dim transition-colors duration-300 hover:border-champagne hover:text-champagne disabled:opacity-40"
        >
          Add gallery image
        </button>
        <input
          ref={galleryInput}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={onPick("gallery")}
        />
        <p className="text-xs text-smoke">
          JPEG, PNG, WebP or AVIF · up to {MAX_IMAGE_LABEL}.
        </p>
      </div>
    </div>
  );
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
