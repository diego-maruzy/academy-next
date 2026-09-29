import {
  getClientPlanLabel,
  isPremiumClientPlan,
  normalizeClientPlan,
  type ClientPlan,
} from "@/lib/clients/client-access";

export function formatClientRole(
  plan: ClientPlan | string | null | undefined,
): "Free" | "Premium" {
  return getClientPlanLabel(normalizeClientPlan(plan));
}

export function formatClientPlan(
  plan: ClientPlan | string | null | undefined,
): "Free" | "Premium" {
  return getClientPlanLabel(normalizeClientPlan(plan));
}

export function isPremiumRole(
  plan: ClientPlan | string | null | undefined,
): boolean {
  return isPremiumClientPlan(normalizeClientPlan(plan));
}

export function isPremiumPlan(
  plan: ClientPlan | string | null | undefined,
): boolean {
  return isPremiumClientPlan(normalizeClientPlan(plan));
}