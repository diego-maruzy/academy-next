export type ClientPlan = "free" | "premium";

export const CLIENT_PLAN_LABELS: Record<ClientPlan, "Free" | "Premium"> = {
  free: "Free",
  premium: "Premium",
};

export function normalizeClientPlan(
  value: string | null | undefined,
): ClientPlan {
  return value?.trim().toLowerCase() === "premium" ? "premium" : "free";
}

export function getClientPlanLabel(plan: ClientPlan): "Free" | "Premium" {
  return CLIENT_PLAN_LABELS[plan];
}

export function isPremiumClientPlan(plan: ClientPlan): boolean {
  return plan === "premium";
}

export type ClientAccessRow = {
  id: string;
  user_id: string;
  plan: ClientPlan;
  status: string;
  source_role: string | null;
  created_at: string;
  updated_at: string;
};

export function resolveClientPlanFromAccess(
  access: Pick<ClientAccessRow, "plan"> | null | undefined,
): ClientPlan {
  if (!access) {
    return "free";
  }

  return normalizeClientPlan(access.plan);
}

export function buildClientAccessPayload(params: {
  userId: string;
  plan: ClientPlan;
  status?: string;
  sourceRole?: string | null;
}) {
  const now = new Date().toISOString();

  return {
    user_id: params.userId,
    plan: params.plan,
    status: params.status ?? "active",
    source_role: params.sourceRole ?? "manual_admin",
    updated_at: now,
    created_at: now,
  };
}
