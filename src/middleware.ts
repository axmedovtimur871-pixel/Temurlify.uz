import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PREFIXES = ["/", "/login", "/register", "/forgot-password", "/auth", "/setup"];
const isPublic = (path: string) =>
  path === "/" || PUBLIC_PREFIXES.some((p) => p !== "/" && (path === p || path.startsWith(p + "/")));

// Refreshes the Supabase session cookie on every request and keeps
// signed-out visitors away from the app. Role checks happen in layouts.
// Kept as Edge `middleware` (not Node `proxy`) because the Cloudflare adapter
// (OpenNext) only fully supports Edge middleware.
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;

  if (!url || !key) {
    // Not configured yet: send everything to the setup page.
    if (path === "/setup" || path === "/") return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (!signedIn && !isPublic(path) && !path.startsWith("/api/")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }
  if (signedIn && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|mp4|pdf)$).*)"],
};
