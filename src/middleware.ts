import type { NextRequest } from "next/server";
import { updateAdminSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateAdminSession(request);
}

export const config = {
  // Only the admin area needs session handling.
  matcher: ["/admin/:path*"],
};
