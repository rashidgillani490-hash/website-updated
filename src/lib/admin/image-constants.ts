/** Shared by the upload UI (client) and the storage adapter (server). */

/** Formats the admin may upload — normal images only, never a 3D model. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const MAX_IMAGE_LABEL = "5 MB";
