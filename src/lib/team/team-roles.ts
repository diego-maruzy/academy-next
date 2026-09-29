export const TEAM_USER_ROLES = [
  "admin",
  "academy_manager",
  "academy_editor",
] as const;

export type TeamUserRole = (typeof TEAM_USER_ROLES)[number];

export const TEAM_USER_ROLE_LABELS: Record<TeamUserRole, string> = {
  admin: "Administrador",
  academy_manager: "Gestor Academy",
  academy_editor: "Editor Academy",
};

const LEGACY_PERMISSION_TO_ROLE: Record<string, TeamUserRole> = {
  admin_access: "admin",
  academy_access: "academy_manager",
  support_access: "academy_editor",
  property_access: "academy_editor",
};

export function normalizeTeamUserRole(value: string | null | undefined): TeamUserRole {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (LEGACY_PERMISSION_TO_ROLE[normalized]) {
    return LEGACY_PERMISSION_TO_ROLE[normalized];
  }

  if ((TEAM_USER_ROLES as readonly string[]).includes(normalized)) {
    return normalized as TeamUserRole;
  }

  return "academy_editor";
}

export function formatTeamUserRole(value: string | null | undefined): string {
  const role = normalizeTeamUserRole(value);
  return TEAM_USER_ROLE_LABELS[role];
}

export function isTeamUserRole(value: string): value is TeamUserRole {
  return (TEAM_USER_ROLES as readonly string[]).includes(value);
}
