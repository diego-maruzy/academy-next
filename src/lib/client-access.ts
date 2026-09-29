import {
  createSupabaseReadServerClient,
  createSupabaseServiceServerClient,
} from "@/lib/supabase/server";

export type ClientPlan = "free" | "premium";

export type ClientAccessRow = {
  id: string;
  user_id: string;
  plan: ClientPlan;
  status: string;
  source_role: string | null;
  created_at: string;
  updated_at: string;
};

export type NormalizedClientAccess = {
  plan: ClientPlan;
  planLabel: "Free" | "Premium";
  isPremium: boolean;
  status: string;
  sourceRole: string | null;
};

export function normalizeClientPlan(
  plan: string | null | undefined,
): ClientPlan {
  const normalized = String(plan ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "premium") {
    return "premium";
  }

  return "free";
}

export function getClientPlanLabel(plan: string | null | undefined) {
  return normalizeClientPlan(plan) === "premium" ? "Premium" : "Free";
}

export function isPremiumPlan(plan: string | null | undefined) {
  return normalizeClientPlan(plan) === "premium";
}

export function normalizeClientAccess(
  access: Partial<ClientAccessRow> | null | undefined,
  fallbackStatus = "active",
): NormalizedClientAccess {
  const plan = normalizeClientPlan(access?.plan);

  return {
    plan,
    planLabel: getClientPlanLabel(plan),
    isPremium: plan === "premium",
    status: access?.status || fallbackStatus || "active",
    sourceRole: access?.source_role ?? null,
  };
}

export async function getClientAccessByUserId(
  userId: string,
): Promise<NormalizedClientAccess> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return normalizeClientAccess(null);
  }

  const { data, error } = await supabase
    .from("client_access")
    .select("id, user_id, plan, status, source_role, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[client-access] Erro ao buscar acesso do cliente:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    return normalizeClientAccess(null);
  }

  return normalizeClientAccess(data as ClientAccessRow | null);
}

export async function getClientAccessMapByUserIds(
  userIds: string[],
): Promise<Map<string, NormalizedClientAccess>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  const accessMap = new Map<string, NormalizedClientAccess>();

  if (uniqueUserIds.length === 0) {
    return accessMap;
  }

  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return accessMap;
  }

  const { data, error } = await supabase
    .from("client_access")
    .select("id, user_id, plan, status, source_role, created_at, updated_at")
    .in("user_id", uniqueUserIds);

  if (error) {
    console.error("[client-access] Erro ao buscar mapa de acessos:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    return accessMap;
  }

  for (const item of (data ?? []) as ClientAccessRow[]) {
    accessMap.set(item.user_id, normalizeClientAccess(item));
  }

  return accessMap;
}

export async function upsertClientAccess(input: {
  userId: string;
  plan: ClientPlan | string;
  status?: string | null;
  sourceRole?: string | null;
}) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return {
      success: false as const,
      error: "Supabase service role não configurado.",
    };
  }

  const plan = normalizeClientPlan(input.plan);

  const { error } = await supabase.from("client_access").upsert(
    {
      user_id: input.userId,
      plan,
      status: input.status || "active",
      source_role: input.sourceRole ?? "manual_admin",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    console.error("[client-access] Erro ao salvar acesso do cliente:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    return {
      success: false as const,
      error: error.message,
    };
  }

  return {
    success: true as const,
    plan,
  };
}