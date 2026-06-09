import {
  extractApplicationRolesFromPayload,
  mapKeycloakRolesToAppRole,
  type AcademyAppRole,
} from "@/lib/auth/keycloak-roles";

export type KeycloakRolesSource = "keycloak" | "fallback" | "host-tokens";

export type ResolvedKeycloakRoles = {
  roles: string[];
  ignoredRoles: string[];
  appRole: AcademyAppRole;
  source: KeycloakRolesSource;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");

    if (parts.length < 2) {
      return null;
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      "=",
    );
    const json = Buffer.from(padded, "base64").toString("utf8");

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveFromPayload(
  payload: Record<string, unknown> | null | undefined,
  source: KeycloakRolesSource,
): ResolvedKeycloakRoles | null {
  if (!payload) {
    return null;
  }

  const { applicationRoles, ignoredRoles } =
    extractApplicationRolesFromPayload(payload);

  if (applicationRoles.length === 0) {
    return null;
  }

  return {
    roles: applicationRoles,
    ignoredRoles,
    appRole: mapKeycloakRolesToAppRole(applicationRoles),
    source,
  };
}

export function resolveKeycloakRolesFromAuthPayload(input: {
  profile?: Record<string, unknown> | null;
  accessToken?: string | null;
  idToken?: string | null;
  rolesSource?: KeycloakRolesSource;
}): ResolvedKeycloakRoles {
  const source = input.rolesSource ?? "keycloak";
  const accessPayload = input.accessToken
    ? decodeJwtPayload(input.accessToken)
    : null;
  const idPayload = input.idToken ? decodeJwtPayload(input.idToken) : null;

  const fromAccess = resolveFromPayload(accessPayload, source);

  if (fromAccess) {
    return fromAccess;
  }

  const fromId = resolveFromPayload(idPayload, source);

  if (fromId) {
    return fromId;
  }

  const fromProfile = resolveFromPayload(input.profile, source);

  if (fromProfile) {
    return fromProfile;
  }

  const ignoredRoles = [
    ...new Set(
      [
        ...(accessPayload
          ? extractApplicationRolesFromPayload(accessPayload).ignoredRoles
          : []),
        ...(idPayload
          ? extractApplicationRolesFromPayload(idPayload).ignoredRoles
          : []),
        ...(input.profile
          ? extractApplicationRolesFromPayload(input.profile).ignoredRoles
          : []),
      ].filter(Boolean),
    ),
  ];

  return {
    roles: [],
    ignoredRoles,
    appRole: "free",
    source: "fallback",
  };
}
