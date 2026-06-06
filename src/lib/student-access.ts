import type { Program } from "@/types/academy";

export type CurrentStudent = {
  id?: string;
  email?: string;
  full_name?: string;
  role?: string | null;
  hasPremiumAccess?: boolean;
};

const PREMIUM_ACCESS_ROLES = new Set([
  "ROLE_USER",
  "PREMIUM",
  "ADMIN",
  "ACADEMY_ACCESS",
  "PROPERTY_ACCESS",
]);

export const DEFAULT_UPGRADE_URL = "/pay/year";

/**
 * Quando Keycloak estiver ativo, substituir esta lógica por
 * roles/groups/plano do usuário autenticado.
 */
export function studentHasProgramAccess(
  program: Pick<Program, "is_premium">,
  currentStudent: CurrentStudent | null,
): boolean {
  if (!program.is_premium) {
    return true;
  }

  if (!currentStudent) {
    return false;
  }

  if (currentStudent.hasPremiumAccess) {
    return true;
  }

  const role = currentStudent.role?.trim().toUpperCase();

  if (role && PREMIUM_ACCESS_ROLES.has(role)) {
    return true;
  }

  return false;
}

export function getProgramUpgradeUrl(
  upgradeUrl: string | null | undefined,
): string {
  const trimmed = upgradeUrl?.trim();
  return trimmed || DEFAULT_UPGRADE_URL;
}
