import type { AdminPermission } from "@/lib/admin-auth/permissions";

export type AcademyAppRole = "free" | "premium" | "admin";

type RealmAccess = {
  roles?: string[];
};

type ResourceAccess = Record<string, { roles?: string[] } | undefined>;

export type PartitionedKeycloakRoles = {
  applicationRoles: string[];
  ignoredRoles: string[];
};

const APPLICATION_ROLE_NORMALIZED = new Set([
  "role_user_free",
  "role_user",
  "role_admin",
  "admin",
  "user",
]);

function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

function isApplicationRole(role: string) {
  return APPLICATION_ROLE_NORMALIZED.has(normalizeRole(role));
}

export function extractRawKeycloakRoles(
  source: Record<string, unknown> | null | undefined,
): string[] {
  if (!source) {
    return [];
  }

  const realmAccess = source.realm_access as RealmAccess | undefined;
  const realmRoles = realmAccess?.roles ?? [];

  const resourceAccess = source.resource_access as ResourceAccess | undefined;
  const resourceRoles = resourceAccess
    ? Object.values(resourceAccess).flatMap((entry) => entry?.roles ?? [])
    : [];

  const topLevelRoles = Array.isArray(source.roles)
    ? source.roles.filter((role): role is string => typeof role === "string")
    : [];

  const merged = [...realmRoles, ...resourceRoles, ...topLevelRoles]
    .map((role) => role.trim())
    .filter((role) => role.length > 0);

  return [...new Set(merged)];
}

export function partitionKeycloakRoles(
  rawRoles: string[],
): PartitionedKeycloakRoles {
  const applicationRoles: string[] = [];
  const ignoredRoles: string[] = [];

  for (const role of rawRoles) {
    const trimmed = role.trim();

    if (!trimmed) {
      continue;
    }

    if (isApplicationRole(trimmed)) {
      applicationRoles.push(trimmed);
      continue;
    }

    ignoredRoles.push(trimmed);
  }

  return {
    applicationRoles: [...new Set(applicationRoles)],
    ignoredRoles: [...new Set(ignoredRoles)],
  };
}

export function mapKeycloakRolesToAppRole(roles: string[]): AcademyAppRole {
  const normalized = roles.map(normalizeRole);

  if (normalized.includes("role_admin") || normalized.includes("admin")) {
    return "admin";
  }

  if (normalized.includes("role_user_free")) {
    return "free";
  }

  if (normalized.includes("role_user")) {
    return "premium";
  }

  if (normalized.includes("user")) {
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

  if (normalized.includes("role_admin") || normalized.includes("admin")) {
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
  return "/dashboard";
}
