import { NextResponse, type NextRequest } from "next/server";
import { resolveAdminMiddlewareState } from "@/lib/admin-auth/middleware-admin";
import {
  getDefaultAdminPath,
  isProtectedPanelPath,
} from "@/lib/admin-auth/permissions";
import { copyEmbeddedSearchParams } from "@/lib/embedded-params";
import { getSupabaseAuthUser } from "@/lib/supabase/middleware";
import {
  isAdminApiPath,
  isAdminLoginPath,
  isPublicPath,
  isStudentLoginPath,
  requiresStudentAuth,
} from "@/lib/auth/route-guard";

function buildStudentLoginRedirect(request: NextRequest, nextPath: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", nextPath);
  copyEmbeddedSearchParams(request.nextUrl.searchParams, loginUrl.searchParams);
  return loginUrl;
}

function buildAdminLoginRedirect(
  request: NextRequest,
  options?: { error?: "unauthorized"; nextPath?: string },
) {
  const loginUrl = new URL("/admin/login", request.url);

  if (options?.error) {
    loginUrl.searchParams.set("error", options.error);
  } else if (options?.nextPath) {
    loginUrl.searchParams.set("next", options.nextPath);
  }

  return loginUrl;
}

function redirectShortsToReels(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/shorts" || pathname.startsWith("/shorts/")) {
    const reelsUrl = request.nextUrl.clone();
    reelsUrl.pathname = pathname.replace(/^\/shorts/, "/reels");
    return NextResponse.redirect(reelsUrl);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminApiPath(pathname)) {
    return NextResponse.next();
  }

  const shortsRedirect = redirectShortsToReels(request);
  if (shortsRedirect) {
    return shortsRedirect;
  }

  if (isAdminLoginPath(pathname)) {
    const { isAdmin } = await resolveAdminMiddlewareState(request);

    if (isAdmin) {
      const next =
        request.nextUrl.searchParams.get("next") ?? getDefaultAdminPath();
      return NextResponse.redirect(new URL(next, request.url));
    }

    return NextResponse.next();
  }

  if (isStudentLoginPath(pathname)) {
    const supabaseUser = await getSupabaseAuthUser(request);

    if (supabaseUser) {
      const callbackUrl = request.nextUrl.searchParams.get("next") ?? "/dashboard";
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }

    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPanelPath(pathname)) {
    const { authenticated, isAdmin } =
      await resolveAdminMiddlewareState(request);

    if (!isAdmin) {
      if (authenticated) {
        return NextResponse.redirect(
          buildAdminLoginRedirect(request, { error: "unauthorized" }),
        );
      }

      return NextResponse.redirect(
        buildAdminLoginRedirect(request, { nextPath: pathname }),
      );
    }

    return NextResponse.next();
  }

  if (requiresStudentAuth(pathname)) {
    const supabaseUser = await getSupabaseAuthUser(request);

    if (!supabaseUser) {
      return NextResponse.redirect(buildStudentLoginRedirect(request, pathname));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/admin/login",
    "/test",
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
