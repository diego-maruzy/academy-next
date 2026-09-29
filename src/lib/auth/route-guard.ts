import { buildPathWithEmbeddedParams } from "@/lib/embedded-params";

export function isAdminLoginPath(pathname: string) {
  return pathname === "/admin/login";
}

export function isStudentLoginPath(pathname: string) {
  return pathname === "/login";
}

export function isStudentPasswordResetPath(pathname: string) {
  return pathname === "/forgot-password" || pathname === "/reset-password";
}

export function resolveStudentCallbackUrl(value?: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return getStudentPostLoginPath();
}

export function getStudentCallbackUrlFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
) {
  const base = resolveStudentCallbackUrl(
    searchParams.get("callbackUrl") ?? searchParams.get("next"),
  );

  return buildPathWithEmbeddedParams(base, searchParams);
}

export function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/test" ||
    isStudentLoginPath(pathname) ||
    isStudentPasswordResetPath(pathname) ||
    isAdminLoginPath(pathname) ||
    pathname.startsWith("/pay")
  );
}

export function isAdminApiPath(pathname: string) {
  return (
    pathname === "/api/admin/login" || pathname === "/api/admin/logout"
  );
}

/** Rotas do aluno — exigem sessão Supabase. */
export function requiresStudentAuth(pathname: string) {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }

  if (pathname === "/programas" || pathname.startsWith("/programas/")) {
    return true;
  }

  if (pathname === "/reels" || pathname.startsWith("/reels/")) {
    return true;
  }

  return false;
}

export function getStudentPostLoginPath() {
  return "/dashboard";
}
