import type { SidebarItem } from "@/components/layout/sidebar-items";
import {
  SIDEBAR_GROUP_LABELS,
  SIDEBAR_GROUP_ORDER,
} from "@/components/layout/sidebar-items";
import type { AdminPermission } from "@/lib/admin-auth/permissions";

const MOBILE_PRIMARY_HREFS: Record<AdminPermission, string[]> = {
  admin_access: [
    "/admin",
    "/clientes",
    "/admin/programas",
    "/admin/shorts",
  ],
  academy_access: ["/admin", "/clientes"],
  support_access: ["/admin", "/clientes"],
  property_access: ["/admin"],
};

const MAX_PRIMARY_ITEMS = 4;

const MOBILE_SHORT_LABELS: Record<string, string> = {
  "/admin": "Início",
  "/programas": "Programas",
  "/reels": "Reels",
  "/clientes": "Clientes",
  "/admin/programas": "Conteúdo",
  "/admin/shorts": "Reels",
  "/equipe": "Equipe",
  "/conexoes": "Conexões",
  "/configuracoes": "Config.",
  "/pagamentos": "Pagamentos",
  "/administrador": "Admin",
  "/admin/emails": "E-mails",
};

export function getAdminMobileNavLabel(href: string, fallback: string) {
  return MOBILE_SHORT_LABELS[href] ?? fallback;
}

export function getAdminMobileNavItems(
  permission: AdminPermission,
  allowedItems: SidebarItem[],
) {
  const priorities = MOBILE_PRIMARY_HREFS[permission] ?? ["/admin"];
  const primary: SidebarItem[] = [];
  const usedHrefs = new Set<string>();

  for (const href of priorities) {
    const item = allowedItems.find((entry) => entry.href === href);

    if (item && primary.length < MAX_PRIMARY_ITEMS) {
      primary.push(item);
      usedHrefs.add(item.href);
    }
  }

  for (const item of allowedItems) {
    if (primary.length >= MAX_PRIMARY_ITEMS) {
      break;
    }

    if (!usedHrefs.has(item.href)) {
      primary.push(item);
      usedHrefs.add(item.href);
    }
  }

  const overflowItems = allowedItems.filter((item) => !usedHrefs.has(item.href));

  return {
    primaryItems: primary,
    overflowItems,
  };
}

export function isAdminMobileNavItemActive(pathname: string, href: string) {
  if (href === "/programas") {
    return pathname === "/programas";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isAdminMobileOverflowActive(
  pathname: string,
  overflowItems: SidebarItem[],
) {
  return overflowItems.some((item) =>
    isAdminMobileNavItemActive(pathname, item.href),
  );
}

export function getAdminMobileNavGroups(items: SidebarItem[]) {
  return SIDEBAR_GROUP_ORDER.map((group) => ({
    label: SIDEBAR_GROUP_LABELS[group],
    items: items.filter((item) => item.group === group),
  })).filter((group) => group.items.length > 0);
}
