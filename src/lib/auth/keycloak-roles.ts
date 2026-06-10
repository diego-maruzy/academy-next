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

const TECHNICAL_ROLE_EXACT = new Set([
  "offline_access",
  "uma_authorization",
  "manage-users",
  "view-users",
  "query-groups",
  "query-users",
  "manage-account",
  "manage-account-links",
  "view-profile",
]);

const DEFAULT_PROPERTY_RESOURCE_CLIENTS = [
  "checkmate-property-public",
  "checkmate-property-private",
];

function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

function isApplicationRole(role: string) {
  return APPLICATION_ROLE_NORMALIZED.has(normalizeRole(role));
}

export function isTechnicalKeycloakRole(role: string) {
  const normalized = normalizeRole(role);

  if (TECHNICAL_ROLE_EXACT.has(normalized)) {
    return true;
  }

  return normalized.startsWith("default-roles-");
}

export function getKeycloakResourceClientIds() {
  const defaults = [
    process.env.KEYCLOAK_PUBLIC_CLIENT_ID ?? "checkmate-academy-public",
    process.env.KEYCLOAK_CLIENT_ID,
  ];

  const hostClients = (process.env.KEYCLOAK_HOST_CLIENT_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [
    ...new Set(
      [...defaults, ...hostClients, ...DEFAULT_PROPERTY_RESOURCE_CLIENTS].filter(
        Boolean,
      ),
    ),
  ] as string[];
}

function partitionRoleList(rawRoles: string[]): PartitionedKeycloakRoles {
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

export function extractApplicationRolesFromPayload(
  source: Record<string, unknown> | null | undefined,
): PartitionedKeycloakRoles {
  if (!source) {
    return { applicationRoles: [], ignoredRoles: [] };
  }

  const applicationRoles: string[] = [];
  const ignoredRoles: string[] = [];
  const prioritizedClients = getKeycloakResourceClientIds();
  const resourceAccess = source.resource_access as ResourceAccess | undefined;

  const addRoles = (roles: string[] | undefined, forceIgnored = false) => {
    for (const role of roles ?? []) {
      const trimmed = role.trim();

      if (!trimmed) {
        continue;
      }

      if (!forceIgnored && isApplicationRole(trimmed)) {
        applicationRoles.push(trimmed);
        continue;
      }

      ignoredRoles.push(trimmed);
    }
  };

  for (const clientId of prioritizedClients) {
    addRoles(resourceAccess?.[clientId]?.roles);
  }

  if (resourceAccess) {
    for (const [clientId, entry] of Object.entries(resourceAccess)) {
      if (prioritizedClients.includes(clientId)) {
        continue;
      }

      addRoles(entry?.roles);
    }
  }

  const realmAccess = source.realm_access as RealmAccess | undefined;

  for (const role of realmAccess?.roles ?? []) {
    const trimmed = role.trim();

    if (!trimmed) {
      continue;
    }

    if (isApplicationRole(trimmed)) {
      applicationRoles.push(trimmed);
      continue;
    }

    if (isTechnicalKeycloakRole(trimmed) || !isApplicationRole(trimmed)) {
      ignoredRoles.push(trimmed);
    }
  }

  const topLevelRoles = Array.isArray(source.roles)
    ? source.roles.filter((role): role is string => typeof role === "string")
    : [];

  addRoles(topLevelRoles);

  return {
    applicationRoles: [...new Set(applicationRoles)],
    ignoredRoles: [...new Set(ignoredRoles)],
  };
}

export function extractRawKeycloakRoles(
  source: Record<string, unknown> | null | undefined,
): string[] {
  const { applicationRoles, ignoredRoles } =
    extractApplicationRolesFromPayload(source);

  return [...new Set([...applicationRoles, ...ignoredRoles])];
}

export function partitionKeycloakRoles(
  rawRoles: string[],
): PartitionedKeycloakRoles {
  return partitionRoleList(rawRoles);
}

export function mapKeycloakRolesToAppRole(roles: string[]): AcademyAppRole {
  const normalized = new Set(roles.map(normalizeRole));

  if (
    normalized.has("role_admin") ||
    normalized.has("admin") ||
    normalized.has("admin_access")
  ) {
    return "admin";
  }

  if (normalized.has("role_user")) {
    return "premium";
  }

  if (normalized.has("role_user_free")) {
    return "free";
  }

  if (normalized.has("user")) {
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
  const normalized = new Set(roles.map(normalizeRole));

  if (normalized.has("role_admin") || normalized.has("admin")) {
    return "admin_access";
  }

  if (
    normalized.has("role_academy") ||
    normalized.has("academy_access") ||
    normalized.has("role_team") ||
    normalized.has("team")
  ) {
    return "academy_access";
  }

  if (normalized.has("role_support") || normalized.has("support_access")) {
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
