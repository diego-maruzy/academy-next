import {
  extractRawKeycloakRoles,
  mapKeycloakRolesToAppRole,
  partitionKeycloakRoles,
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
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function resolveKeycloakRolesFromAuthPayload(input: {
  profile?: Record<string, unknown> | null;
  accessToken?: string | null;
  idToken?: string | null;
}): ResolvedKeycloakRoles {
  const payloads = [
    input.profile,
    input.accessToken ? decodeJwtPayload(input.accessToken) : null,
    input.idToken ? decodeJwtPayload(input.idToken) : null,
  ].filter((payload): payload is Record<string, unknown> => Boolean(payload));

  const rawRoles = [
    ...new Set(payloads.flatMap((payload) => extractRawKeycloakRoles(payload))),
  ];

  if (rawRoles.length === 0) {
    return {
      roles: [],
      ignoredRoles: [],
      appRole: "free",
      source: "fallback",
    };
  }

  const { applicationRoles, ignoredRoles } = partitionKeycloakRoles(rawRoles);

  return {
    roles: applicationRoles,
    ignoredRoles,
    appRole: mapKeycloakRolesToAppRole(applicationRoles),
    source: applicationRoles.length > 0 ? "keycloak" : "fallback",
  };
}
