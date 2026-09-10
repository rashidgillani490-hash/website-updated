import "server-only";

import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminRepository } from "./repository";

/** Admin repository bound to the current request's session. Redirects to the
 *  login page if the caller is not an admin. */
export async function getAdminRepo(): Promise<AdminRepository> {
  const { supabase } = await requireAdmin();
  return new AdminRepository(supabase);
}
