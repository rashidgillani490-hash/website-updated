import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "./image-constants";

export const IMAGE_BUCKET = "perfume-images";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type StorageResult<T> = { ok: true; value: T } | { ok: false; error: string };

function isAllowed(type: string): type is (typeof ALLOWED_IMAGE_TYPES)[number] {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

/**
 * Validate and upload one image to the `perfume-images` bucket. Normal image
 * files only — JPEG / PNG / WebP / AVIF; no 3D model formats are accepted.
 * Returns the Storage object key to store in `perfume_images.path`. All Supabase
 * errors are logged server-side and replaced with a plain message.
 */
export async function uploadPerfumeImage(
  db: SupabaseClient,
  slug: string,
  file: File | null,
): Promise<StorageResult<{ path: string }>> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Choose an image file to upload." };
  }
  if (!isAllowed(file.type)) {
    return { ok: false, error: "Use a JPEG, PNG, WebP or AVIF image." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }

  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "perfume";
  const key = `${safeSlug}/${crypto.randomUUID()}.${EXT[file.type] ?? "img"}`;

  const { error } = await db.storage
    .from(IMAGE_BUCKET)
    .upload(key, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[storage] upload failed:", error.message);
    return { ok: false, error: "The upload failed. Please try again." };
  }
  return { ok: true, value: { path: key } };
}

/**
 * Remove one image from the bucket. A locally-hosted `/public` path (from the
 * seed data) is not a Storage object, so it is treated as already gone.
 */
export async function deletePerfumeImage(
  db: SupabaseClient,
  path: string,
): Promise<StorageResult<null>> {
  if (!path || path.startsWith("/") || /^https?:\/\//i.test(path)) {
    return { ok: true, value: null };
  }
  const { error } = await db.storage.from(IMAGE_BUCKET).remove([path]);
  if (error) {
    console.error("[storage] delete failed:", error.message);
    return { ok: false, error: "Could not remove the image. Please try again." };
  }
  return { ok: true, value: null };
}
