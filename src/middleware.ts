import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionFromToken,
} from "@/lib/admin-auth/admin-session";
import {
  canAccessAdminRoute,
  getDefaultAdminPath,
  isProtectedPanelPath,
} from "@/lib/admin-auth/permissions";
import {
  getStudentCallbackUrlFromSearchParams,
  isAdminApiPath,
  isAdminLoginPath,
  isKeycloakApiPath,
  isPublicPath,
  isStudentLoginPath,
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

async function getKeycloakToken(request: NextRequest) {
  return getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isKeycloakApiPath(pathname) || isAdminApiPath(pathname)) {
    return NextResponse.next();
  }

  const shortsRedirect = redirectShortsToReels(request);
  if (shortsRedirect) {
    return shortsRedirect;
  }

  if (isAdminLoginPath(pathname)) {
    const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const adminSession = adminToken
      ? await verifyAdminSessionFromToken(adminToken)
      : null;

    if (adminSession) {
      const next =
        request.nextUrl.searchParams.get("next") ?? getDefaultAdminPath();
      return NextResponse.redirect(new URL(next, request.url));
    }

    return NextResponse.next();
  }

  if (isStudentLoginPath(pathname)) {
    if (
      pathname === "/oidc/login" ||
      pathname === "/auth/callback" ||
      pathname === "/auth/silent-callback"
    ) {
      return NextResponse.next();
    }

    const keycloakToken = await getKeycloakToken(request);

    if (keycloakToken) {
      const callbackUrl = getStudentCallbackUrlFromSearchParams(
        request.nextUrl.searchParams,
      );
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }

    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPanelPath(pathname)) {
    const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const adminSession = adminToken
      ? await verifyAdminSessionFromToken(adminToken)
      : null;

    if (!adminSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessAdminRoute(adminSession, pathname)) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    return NextResponse.next();
  }

  if (requiresKeycloakAuth(pathname)) {
    const keycloakToken = await getKeycloakToken(request);

    if (!keycloakToken) {
      const loginUrl = new URL("/oidc/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/oidc/login",
    "/oidc/complete",
    "/auth/callback",
    "/auth/silent-callback",
    "/admin/login",
    "/auth-debug",
    "/test",
    "/mobile-oidc-debug",
    "/dashboard",
    "/dashboard/:path*",
    "/programas",
    "/programas/:path*",
    "/reels",
    "/reels/:path*",
    "/shorts",
    "/shorts/:path*",
    "/clientes",
    "/clientes/:path*",
    "/equipe",
    "/equipe/:path*",
    "/conexoes",
    "/conexoes/:path*",
    "/configuracoes",
    "/configuracoes/:path*",
    "/administrador",
    "/administrador/:path*",
    "/pagamentos",
    "/pagamentos/:path*",
    "/admin/:path*",
    "/access-denied",
  ],
};
