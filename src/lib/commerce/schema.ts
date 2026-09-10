import { z } from "zod";
import { MAX_QTY } from "./types";

/**
 * Checkout validation. The same schema runs on the client (instant field
 * errors) and again in the Server Action (never trust the client). `safeParse`
 * and hand `fieldErrors()` straight to the form.
 */

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} is too long.`);

export const orderCustomerSchema = z.object({
  name: trimmed(2, 120, "Name"),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a reachable phone number.")
    .max(30, "That phone number is too long.")
    .regex(/^[0-9+()\-\s]+$/, "Use digits, spaces and + ( ) - only."),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine(
      (v) => v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Enter a valid email address.",
    ),
  address: trimmed(4, 200, "Delivery address"),
  city: trimmed(2, 80, "City"),
  notes: z
    .string()
    .trim()
    .max(500, "Please keep notes under 500 characters.")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type OrderCustomerInput = z.infer<typeof orderCustomerSchema>;

export const orderLineSchema = z.object({
  slug: z.string().trim().min(1),
  ml: z.coerce.number().int().positive(),
  qty: z.coerce.number().int().min(1).max(MAX_QTY),
  /** Display only — for a friendly "no longer available" message. The server
   *  re-prices from the catalogue regardless of anything the client sends. */
  name: z.string().trim().max(120).optional(),
});

export const orderLinesSchema = z
  .array(orderLineSchema)
  .min(1, "Your bag is empty.")
  .max(50);

export const placeOrderSchema = z.object({
  customer: orderCustomerSchema,
  items: orderLinesSchema,
  // One method today; `z.enum` keeps the door open for more.
  paymentMethod: z.enum(["cod"]),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

/** Flatten a ZodError to `{ "customer.phone": "message", ... }` for the form. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
