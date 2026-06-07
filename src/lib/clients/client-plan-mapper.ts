import {
  LEGACY_PLAN_FREE,
  LEGACY_PLAN_PREMIUM,
} from "@/lib/import/client-import-utils";

const PLAN_LABELS: Record<string, string> = {
  [LEGACY_PLAN_FREE]: "Free",
  [LEGACY_PLAN_PREMIUM]: "Premium",
};

export function getPlanLabel(planId: string | null | undefined): string {
  if (!planId) {
    return "Plano não identificado";
  }

  return PLAN_LABELS[planId] ?? "Plano não identificado";
}

export function isPremiumPlanId(planId: string | null | undefined): boolean {
  return planId === LEGACY_PLAN_PREMIUM;
}

export function isFreePlanId(planId: string | null | undefined): boolean {
  return !planId || planId === LEGACY_PLAN_FREE;
}
