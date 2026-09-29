import type { Program } from "@/types/academy";
import { isPremiumClientPlan, normalizeClientPlan } from "@/lib/clients/client-access";

export type CurrentStudent = {
  id?: string;
  authUserId?: string;
  email?: string;
  full_name?: string;
  name?: string;
  plan?: "free" | "premium";
  planLabel?: "Free" | "Premium";
  hasPremiumAccess?: boolean;
  isPremium?: boolean;
  accessibleProgramIds?: string[];
  blockedProgramIds?: string[];
};

export const DEFAULT_UPGRADE_URL = "/pay/year";

export function studentHasProgramAccess(
  program: Pick<Program, "id" | "is_premium" | "allowed_roles">,
  currentStudent: CurrentStudent | null,
): boolean {
  /*
    Acesso por programa específico:
    - blockedProgramIds sempre bloqueia.
    - accessibleProgramIds sempre libera.
  */
  if (currentStudent?.blockedProgramIds?.includes(program.id)) {
    return false;
  }

  if (currentStudent?.accessibleProgramIds?.includes(program.id)) {
    return true;
  }

  /*
    Programas gratuitos sempre ficam liberados.
  */
  if (!program.is_premium) {
    return true;
  }

  /*
    Programas premium exigem aluno logado e plano premium.
    A fonte oficial do plano é client_access.plan, exposto em currentStudent.plan.
    Fallback seguro: free.
  */
  if (!currentStudent) {
    return false;
  }

  const plan = normalizeClientPlan(currentStudent.plan);

  return Boolean(
    isPremiumClientPlan(plan) ||
      currentStudent.hasPremiumAccess ||
      currentStudent.isPremium,
  );
}

export function getProgramUpgradeUrl(
  upgradeUrl: string | null | undefined,
): string {
  const trimmed = upgradeUrl?.trim();

  return trimmed || DEFAULT_UPGRADE_URL;
}