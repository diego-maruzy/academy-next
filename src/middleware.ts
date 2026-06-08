import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { sessionToCurrentAdmin } from "@/lib/auth/keycloak-session";
import {
  canAccessPath,
  getPostLoginPath,
  isLoginPath,
  requiresKeycloakAuth,
} from "@/lib/auth/route-guard";

function redirectShortsToReels(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/shorts" || pathname.startsWith("/shorts/")) {
    const reelsUrl = request.nextUrl.clone();
    reelsUrl.pathname = pathname.replace(/^\/shorts/, "/reels");
    return NextResponse.redirect(reelsUrl);
  }

  return null;
}

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/pay")) {
    return NextResponse.next();
  }

  const shortsRedirect = redirectShortsToReels(request);
  if (shortsRedirect) {
    return shortsRedirect;
  }

  const session = request.auth;
  const isAuthenticated = Boolean(session?.user);
  const roles = session?.user?.roles ?? [];
  const admin = sessionToCurrentAdmin(session);

  if (pathname === "/admin/login") {
    const loginUrl = new URL("/login", request.url);
    const next = request.nextUrl.searchParams.get("next");

    if (next) {
      loginUrl.searchParams.set("callbackUrl", next);
    }

    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(next ?? getPostLoginPath(roles), request.url),
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPath(pathname)) {
    if (isAuthenticated) {
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
      return NextResponse.redirect(
        new URL(callbackUrl ?? getPostLoginPath(roles), request.url),
      );
    }

    return NextResponse.next();
  }

  if (!requiresKeycloakAuth(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessPath(pathname, admin, isAuthenticated)) {
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/login",
    "/auth-debug",
    "/programas",
    "/programas/:path*",
    "/reels",
    "/reels/:path*",
    "/shorts",
    "/shorts/:path*",
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
