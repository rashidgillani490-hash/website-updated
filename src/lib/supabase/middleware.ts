import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const LOGIN_PATH = "/admin/login";

/**
 * Runs on every `/admin/*` request. Keeps the Supabase auth cookie fresh and,
 * for a request to a protected admin page with no session, redirects to the
 * login page. This is a fast first gate for UX; the authoritative admin-role
 * check happens again in the protected layout and in every Server Action
 * (never trust middleware alone for authorization).
 */
export async function updateAdminSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === LOGIN_PATH;

  // Supabase not configured: let the request through; the admin pages render a
  // "not configured" state and the public site is unaffected.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
