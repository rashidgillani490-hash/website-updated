"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminRepository } from "@/lib/admin/repository";
import { OrderAdmin } from "@/lib/admin/orders";
import { notifyOrderCancelled } from "@/lib/commerce/notifications";
import {
  deletePerfumeImage,
  uploadPerfumeImage,
} from "@/lib/admin/storage";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/commerce/types";
import {
  fieldErrors,
  imageRoleEnum,
  notesSchema,
  perfumeSchema,
  settingsSchema,
  sizesSchema,
} from "@/lib/admin/schema";

export type ActionResult =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

/** Every admin record id is a database UUID. Guard the loose `string` params
 *  that Server Actions receive from the client before they reach a query. */
const uuid = z.string().uuid();
const INVALID_ID: ActionResult = { ok: false, error: "Invalid request." };

/**
 * Settings and the perfume catalogue both feed the shared root layout
 * (header, footer, metadata, home). One `revalidatePath` call covers the whole
 * public tree; the admin screens are dynamic and don't need it.
 */
function revalidateStorefront() {
  revalidatePath("/", "layout");
}

/* ============================================================= site settings */

export async function saveSettings(payload: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  }
  const result = await new AdminRepository(supabase).updateSettings(parsed.data);
  if (!result.ok) return { ok: false, error: result.error };
  revalidateStorefront();
  return { ok: true };
}

/* ================================================================== perfumes */

const perfumePayloadSchema = z.object({
  perfume: perfumeSchema,
  sizes: sizesSchema,
  notes: notesSchema,
});

export async function createPerfume(payload: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = perfumePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  }
  const repo = new AdminRepository(supabase);
  const created = await repo.createPerfume(parsed.data.perfume);
  if (!created.ok) return { ok: false, error: created.error };

  const sized = await repo.setPerfumeSizes(created.value.id, parsed.data.sizes);
  if (!sized.ok) return { ok: false, error: sized.error };
  const noted = await repo.setPerfumeNotes(created.value.id, parsed.data.notes);
  if (!noted.ok) return { ok: false, error: noted.error };

  revalidateStorefront();
  revalidatePath("/admin/fragrances");
  redirect(`/admin/fragrances/${created.value.id}`);
}

export async function updatePerfume(
  id: string,
  payload: unknown,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success) return INVALID_ID;
  const parsed = perfumePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  }
  const repo = new AdminRepository(supabase);
  const updated = await repo.updatePerfume(id, parsed.data.perfume);
  if (!updated.ok) return { ok: false, error: updated.error };
  const sized = await repo.setPerfumeSizes(id, parsed.data.sizes);
  if (!sized.ok) return { ok: false, error: sized.error };
  const noted = await repo.setPerfumeNotes(id, parsed.data.notes);
  if (!noted.ok) return { ok: false, error: noted.error };

  revalidateStorefront();
  revalidatePath("/admin/fragrances");
  revalidatePath(`/admin/fragrances/${id}`);
  return { ok: true };
}

const patchSchema = z.object({
  featured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  availability: z
    .enum(["available", "coming-soon", "sold-out", "archived"])
    .optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

export async function patchPerfume(
  id: string,
  patch: unknown,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success) return INVALID_ID;
  const parsed = patchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: "Invalid change." };
  const result = await new AdminRepository(supabase).patchPerfume(
    id,
    parsed.data,
  );
  if (!result.ok) return { ok: false, error: result.error };
  revalidateStorefront();
  revalidatePath("/admin/fragrances");
  return { ok: true };
}

export async function deletePerfume(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(id).success) return INVALID_ID;
  const repo = new AdminRepository(supabase);

  // Best-effort: remove Storage files before the rows cascade away.
  for (const image of await repo.listImagePaths(id)) {
    await deletePerfumeImage(supabase, image.path);
  }
  const result = await repo.deletePerfume(id);
  if (!result.ok) return { ok: false, error: result.error };

  revalidateStorefront();
  revalidatePath("/admin/fragrances");
  redirect("/admin/fragrances");
}

/* ==================================================================== images */

const uploadMetaSchema = z.object({
  perfumeId: z.string().uuid(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug."),
  role: imageRoleEnum,
  alt: z.string().trim().max(200).default(""),
});

export async function uploadImage(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const meta = uploadMetaSchema.safeParse({
    perfumeId: formData.get("perfumeId"),
    slug: formData.get("slug"),
    role: formData.get("role"),
    alt: formData.get("alt") ?? "",
  });
  if (!meta.success) return { ok: false, error: "Missing upload details." };

  const file = formData.get("file");
  const upload = await uploadPerfumeImage(
    supabase,
    meta.data.slug,
    file instanceof File ? file : null,
  );
  if (!upload.ok) return { ok: false, error: upload.error };

  const repo = new AdminRepository(supabase);

  // Hero is single: a new one replaces (and removes) the previous.
  const previousHero =
    meta.data.role === "hero"
      ? await repo.getHeroImage(meta.data.perfumeId)
      : null;

  const existing = await repo.getPerfumeImages(meta.data.perfumeId);
  const added = await repo.addPerfumeImage(meta.data.perfumeId, {
    role: meta.data.role,
    path: upload.value.path,
    alt: meta.data.alt,
    displayOrder: existing.filter((i) => i.role === meta.data.role).length,
  });
  if (!added.ok) {
    // Roll the orphaned file back so Storage doesn't drift from the table.
    await deletePerfumeImage(supabase, upload.value.path);
    return { ok: false, error: added.error };
  }

  if (previousHero) {
    await deletePerfumeImage(supabase, previousHero.path);
    await repo.deleteImageRow(previousHero.id);
  }

  revalidateStorefront();
  revalidatePath(`/admin/fragrances/${meta.data.perfumeId}`);
  return { ok: true };
}

export async function deleteImage(
  perfumeId: string,
  imageId: string,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(perfumeId).success || !uuid.safeParse(imageId).success) {
    return INVALID_ID;
  }
  const repo = new AdminRepository(supabase);

  const path = await repo.getImagePath(imageId);
  if (path) {
    const removed = await deletePerfumeImage(supabase, path);
    if (!removed.ok) return { ok: false, error: removed.error };
  }
  const result = await repo.deleteImageRow(imageId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidateStorefront();
  revalidatePath(`/admin/fragrances/${perfumeId}`);
  return { ok: true };
}

export async function updateImageAlt(
  perfumeId: string,
  imageId: string,
  alt: unknown,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(perfumeId).success || !uuid.safeParse(imageId).success) {
    return INVALID_ID;
  }
  const parsed = z.string().trim().max(200).safeParse(alt);
  if (!parsed.success) return { ok: false, error: "Description is too long." };
  const result = await new AdminRepository(supabase).updateImageMeta(imageId, {
    alt: parsed.data,
  });
  if (!result.ok) return { ok: false, error: result.error };
  revalidateStorefront();
  revalidatePath(`/admin/fragrances/${perfumeId}`);
  return { ok: true };
}

export async function reorderImages(
  perfumeId: string,
  orderedIds: unknown,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!uuid.safeParse(perfumeId).success) return INVALID_ID;
  const parsed = z.array(uuid).min(1).max(24).safeParse(orderedIds);
  if (!parsed.success) return { ok: false, error: "Invalid order." };
  const result = await new AdminRepository(supabase).reorderImages(
    perfumeId,
    parsed.data,
  );
  if (!result.ok) return { ok: false, error: result.error };
  revalidateStorefront();
  revalidatePath(`/admin/fragrances/${perfumeId}`);
  return { ok: true };
}

/* ==================================================================== orders */

const orderStatusSchema = z.object({
  id: z.string().uuid("Invalid order."),
  status: z.enum(ORDER_STATUSES as [OrderStatus, ...OrderStatus[]]),
});

/**
 * Move an order along its workflow. The RLS `admins update orders` policy is
 * the real gate; `requireAdmin()` here just fails fast. Orders never touch the
 * storefront cache, only the two admin views.
 */
export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  const parsed = orderStatusSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Invalid status change." };

  const orders = new OrderAdmin(supabase);

  // Fetch the order first only when we may need its contact details for a
  // cancellation notification.
  const cancelling = parsed.data.status === "cancelled";
  const before = cancelling ? await orders.get(parsed.data.id) : null;

  const result = await orders.updateStatus(parsed.data.id, parsed.data.status, {
    id: user.id,
    label: user.email ?? undefined,
  });
  if (!result.ok) return { ok: false, error: result.error };

  // Fire the cancellation notification only on a real transition to cancelled.
  if (cancelling && result.changed && result.to === "cancelled" && before) {
    try {
      await notifyOrderCancelled(before);
    } catch (error) {
      console.error("[admin] cancellation notification failed:", error);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.id}`);
  return { ok: true };
}
