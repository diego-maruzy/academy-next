import type { AcademyAppRole } from "@/lib/auth/keycloak-roles";
import type { DecodedJwtPayload } from "@/lib/oidc/jwt-utils";

function normalizeRole(role: string) {
  return role.trim();
}

/**
 * Extrai todas as roles do token, igual ao Lovable:
 * - realm_access.roles
 * - resource_access[*].roles
 */
export function extractAllRolesFromPayload(
  payload: DecodedJwtPayload | null,
): string[] {
  if (!payload) {
    return [];
  }

  const roles = new Set<string>();

  for (const role of payload.realm_access?.roles ?? []) {
    const trimmed = normalizeRole(role);

    if (trimmed) {
      roles.add(trimmed);
    }
  }

  const resourceAccess = payload.resource_access ?? {};

  for (const entry of Object.values(resourceAccess)) {
    for (const role of entry?.roles ?? []) {
      const trimmed = normalizeRole(role);

      if (trimmed) {
        roles.add(trimmed);
      }
    }
  }

  return [...roles];
}

/**
 * Mapeia por igualdade exata (case-insensitive).
 * ROLE_USER_FREE não casa com ROLE_USER.
 */
export function mapOidcRolesToAppRole(roles: string[]): AcademyAppRole {
  const normalized = new Set(roles.map((role) => role.trim().toLowerCase()));

  if (normalized.has("role_admin") || normalized.has("admin_access")) {
    return "admin";
  }

  if (normalized.has("role_user")) {
    return "premium";
  }

  if (normalized.has("role_user_free")) {
    return "free";
  }

  return "free";
}

export function getClientRoleLabel(roles: string[]) {
  const appRole = mapOidcRolesToAppRole(roles);
  return appRole === "premium" || appRole === "admin" ? "ROLE_USER" : "ROLE_USER_FREE";
}
