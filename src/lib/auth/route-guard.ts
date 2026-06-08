import {
  canAccessAdminRoute,
  isProtectedAdminPath,
} from "@/lib/admin-auth/permissions";
import type { CurrentAdmin } from "@/lib/admin-auth/current-admin";
import { getDefaultPathForKeycloakRoles } from "@/lib/auth/keycloak-roles";

function matchesPath(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isStudentPath(pathname: string) {
  return (
    matchesPath(pathname, "/programas") || matchesPath(pathname, "/reels")
  );
}

export function requiresKeycloakAuth(pathname: string) {
  if (pathname === "/auth-debug") {
    return true;
  }

  return isStudentPath(pathname) || isProtectedAdminPath(pathname);
}

export function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname === "/admin/login";
}

export function getPostLoginPath(roles: string[]) {
  return getDefaultPathForKeycloakRoles(roles);
}

export function canAccessPath(
  pathname: string,
  admin: CurrentAdmin | null,
  isAuthenticated: boolean,
) {
  if (isStudentPath(pathname)) {
    return isAuthenticated;
  }

  if (!isProtectedAdminPath(pathname)) {
    return true;
  }

  return canAccessAdminRoute(admin, pathname);
}
