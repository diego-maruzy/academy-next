import type { AdminPermission } from "@/lib/admin-auth/permissions";

export type AcademyAppRole = "free" | "premium" | "admin";

type RealmAccess = {
  roles?: string[];
};

type ResourceAccess = Record<string, { roles?: string[] } | undefined>;

function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

export function extractKeycloakRoles(
  profile: Record<string, unknown> | null | undefined,
): string[] {
  if (!profile) {
    return [];
  }

  const realmAccess = profile.realm_access as RealmAccess | undefined;
  const realmRoles = realmAccess?.roles ?? [];

  const resourceAccess = profile.resource_access as ResourceAccess | undefined;
  const resourceRoles = resourceAccess
    ? Object.values(resourceAccess).flatMap((entry) => entry?.roles ?? [])
    : [];

  const merged = [...realmRoles, ...resourceRoles].map((role) => role.trim());
  return [...new Set(merged.filter(Boolean))];
}

export function mapKeycloakRolesToAppRole(roles: string[]): AcademyAppRole {
  const normalized = roles.map(normalizeRole);

  if (
    normalized.includes("role_admin") ||
    normalized.includes("admin") ||
    normalized.includes("administrator")
  ) {
    return "admin";
  }

  if (normalized.includes("role_user")) {
    return "premium";
  }

  if (normalized.includes("role_user_free")) {
    return "free";
  }

  return "free";
}

export function isKeycloakAdmin(roles: string[]): boolean {
  return mapKeycloakRolesToAppRole(roles) === "admin";
}

export function hasPremiumKeycloakAccess(roles: string[]): boolean {
  const appRole = mapKeycloakRolesToAppRole(roles);
  return appRole === "premium" || appRole === "admin";
}

export function getAdminPermissionFromKeycloakRoles(
  roles: string[],
): AdminPermission | null {
  const normalized = roles.map(normalizeRole);

  if (
    normalized.includes("role_admin") ||
    normalized.includes("admin") ||
    normalized.includes("administrator")
  ) {
    return "admin_access";
  }

  if (
    normalized.includes("role_academy") ||
    normalized.includes("academy_access") ||
    normalized.includes("role_team") ||
    normalized.includes("team")
  ) {
    return "academy_access";
  }

  if (
    normalized.includes("role_support") ||
    normalized.includes("support_access")
  ) {
    return "support_access";
  }

  return null;
}

export function getClientRoleFromKeycloak(roles: string[]): string {
  return hasPremiumKeycloakAccess(roles) ? "ROLE_USER" : "ROLE_USER_FREE";
}

export function getDefaultPathForKeycloakRoles(): string {
  return "/programas";
}
