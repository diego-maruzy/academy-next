import {
  SIDEBAR_ITEMS,
  type SidebarItem,
} from "@/components/layout/sidebar-items";
import type { CurrentAdmin } from "@/lib/admin-auth/current-admin";

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

export function isAdminLoginPath(pathname: string) {
  return pathname === "/admin/login";
}

export function isProtectedPanelPath(pathname: string): boolean {
  if (isAdminLoginPath(pathname)) {
    return false;
  }

  if (pathname === "/access-denied") {
    return true;
  }

  const protectedPrefixes = [
    "/dashboard",
    "/clientes",
    "/equipe",
    "/conexoes",
    "/configuracoes",
    "/administrador",
    "/pagamentos",
    "/admin",
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
    return (
      matchesPath(pathname, "/dashboard") ||
      matchesPath(pathname, "/clientes")
    );
  }

  if (permission === "support_access") {
    return (
      matchesPath(pathname, "/dashboard") ||
      matchesPath(pathname, "/clientes")
    );
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
  return "/dashboard";
}
