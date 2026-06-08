export function isAdminLoginPath(pathname: string) {
  return pathname === "/admin/login";
}

export function isStudentLoginPath(pathname: string) {
  return pathname === "/login";
}

export function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    isStudentLoginPath(pathname) ||
    isAdminLoginPath(pathname) ||
    pathname.startsWith("/pay")
  );
}

export function isAdminApiPath(pathname: string) {
  return (
    pathname === "/api/admin/login" || pathname === "/api/admin/logout"
  );
}

export function isKeycloakApiPath(pathname: string) {
  return pathname.startsWith("/api/auth");
}

/** Rotas do aluno — exigem sessão Keycloak */
export function requiresKeycloakAuth(pathname: string) {
  if (pathname === "/auth-debug") {
    return true;
  }

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
