import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, supabaseHostFromEnv } from "@/lib/security-headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isProd = process.env.NODE_ENV === "production";

const LOGIN_PATH = "/admin/login";

function makeNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Runs on every `/admin/*` request. Two jobs:
 *
 *  1. Content-Security-Policy for the (always dynamically-rendered) admin tree.
 *     In production this is a per-request **nonce** CSP — a strict
 *     `script-src 'nonce-…' 'strict-dynamic'` with no `'unsafe-inline'`. Next
 *     reads the nonce off the forwarded request header and stamps it onto its
 *     framework `<script>` tags. In development the compatible CSP is used so
 *     React Refresh / HMR are unaffected. (The storefront's CSP is static, set
 *     in `next.config.ts`; `/admin` is excluded there.)
 *
 *  2. Keep the Supabase auth cookie fresh and redirect an unauthenticated
 *     request for a protected admin page to the login page. This is a fast
 *     first gate for UX; the authoritative admin-role check happens again in the
 *     protected layout and in every Server Action.
 */
export async function updateAdminSession(
  request: NextRequest,
): Promise<NextResponse> {
  const nonce = isProd ? makeNonce() : undefined;
  const csp = buildCsp({ nonce, isProd, supabaseHost: supabaseHostFromEnv() });

  // Rebuilt each time so it reflects any cookie mutation the Supabase client
  // makes, while always carrying the CSP + nonce for Next's renderer.
  const nextResponse = (): NextResponse => {
    const headers = new Headers(request.headers);
    headers.set("content-security-policy", csp);
    if (nonce) headers.set("x-nonce", nonce);
    const res = NextResponse.next({ request: { headers } });
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  let response = nextResponse();

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === LOGIN_PATH;

  // Supabase not configured: still emit the CSP, skip the session work.
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
        response = nextResponse();
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
    const redirect = NextResponse.redirect(redirectUrl);
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  return response;
}
