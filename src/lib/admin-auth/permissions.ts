import {
  SIDEBAR_ITEMS,
  type SidebarItem,
} from "@/components/layout/sidebar-items";
import type { CurrentAdmin } from "@/lib/admin-auth/current-admin";
import { isAdminLoginPath } from "@/lib/auth/route-guard";

export type AdminPermission =
  | "admin_access"
  | "academy_access"
  | "support_access"
  | "property_access";

export function isAdmin(admin: CurrentAdmin | null): boolean {
  return admin?.permission === "admin_access";
}

export function isTeam(admin: CurrentAdmin | null): boolean {
  return (
    admin?.permission === "academy_access" ||
    admin?.permission === "support_access"
  );
}

function matchesPath(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isAdminHomePath(pathname: string) {
  return pathname === "/admin";
}

function isAdminCrudPath(pathname: string) {
  return pathname.startsWith("/admin/");
}

export function isProtectedPanelPath(pathname: string): boolean {
  if (isAdminLoginPath(pathname)) {
    return false;
  }

  if (pathname === "/access-denied") {
    return true;
  }

  if (isAdminHomePath(pathname) || isAdminCrudPath(pathname)) {
    return true;
  }

  const protectedPrefixes = [
    "/clientes",
    "/equipe",
    "/conexoes",
    "/configuracoes",
    "/administrador",
    "/pagamentos",
  ];

  return protectedPrefixes.some((prefix) => matchesPath(pathname, prefix));
}

/** @deprecated Use isProtectedPanelPath */
export function isProtectedAdminPath(pathname: string): boolean {
  return isProtectedPanelPath(pathname);
}

export function canAccessAdminRoute(
  admin: CurrentAdmin | null,
  pathname: string,
): boolean {
  if (pathname === "/access-denied") {
    return Boolean(admin);
  }

  if (!admin) {
    return false;
  }

  const permission = admin.permission as AdminPermission;

  if (permission === "admin_access") {
    return true;
  }

  if (permission === "academy_access") {
    return isAdminHomePath(pathname) || matchesPath(pathname, "/clientes");
  }

  if (permission === "support_access") {
    return isAdminHomePath(pathname) || matchesPath(pathname, "/clientes");
  }

  return false;
}

export function getAllowedMenuItemsForAdmin(
  admin: CurrentAdmin | null,
): SidebarItem[] {
  if (!admin) {
    return [];
  }

  const permission = admin.permission as AdminPermission;

  return SIDEBAR_ITEMS.filter((item) =>
    item.allowedPermissions.includes(permission),
  );
}

export function getAdminBadgeLabel(admin: CurrentAdmin | null): string {
  if (!admin) {
    return "EQUIPE";
  }

  if (admin.permission === "admin_access") {
    return "ADMINISTRADOR";
  }

  return "EQUIPE";
}

export function getDefaultAdminPath(): string {
  return "/admin";
}
