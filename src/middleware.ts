import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessAdminRoute,
  isProtectedAdminPath,
} from "@/lib/admin-auth/permissions";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionFromToken,
} from "@/lib/admin-auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/programas") || pathname.startsWith("/pay")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (token) {
      const session = await verifyAdminSessionFromToken(token);

      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  }

  if (!isProtectedAdminPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifyAdminSessionFromToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessAdminRoute(session, pathname)) {
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/equipe/:path*",
    "/conexoes/:path*",
    "/configuracoes/:path*",
    "/administrador/:path*",
    "/pagamentos/:path*",
    "/admin/:path*",
    "/access-denied",
    "/admin/login",
  ],
};
