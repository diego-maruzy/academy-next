import type { User } from "@supabase/supabase-js";
import {
  getClientPlanLabel,
  isPremiumClientPlan,
  normalizeClientPlan,
  resolveClientPlanFromAccess,
  type ClientAccessRow,
  type ClientPlan,
} from "@/lib/clients/client-access";
import { getSupabaseCurrentUser } from "@/lib/supabase/auth";
import {
  createSupabaseReadServerClient,
  formatSupabaseError,
} from "@/lib/supabase/server";

export type CurrentStudent = {
  id: string;
  authUserId: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  status: string | null;
  profileStatus: string | null;
  accessStatus: string | null;
  isActive: boolean;
  plan: ClientPlan;
  planLabel: "Free" | "Premium";
  isPremium: boolean;
  accessibleProgramIds: string[];
  blockedProgramIds: string[];
  full_name: string;
  hasPremiumAccess: boolean;
};

export type CurrentClient = CurrentStudent;

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  status: string | null;
  last_login_at: string | null;
};

type ProgramOverrideRow = {
  program_id: string;
  mode: string | null;
};

const inactiveStatuses = new Set(["blocked", "inactive", "disabled"]);

let warnedMissingProfileForUserId: string | null = null;

function logSupabaseError(context: string, error: unknown) {
  const formatted = formatSupabaseError(error);

  console.error(context, {
    message: formatted.message,
    details: formatted.details,
    hint: formatted.hint,
    code: formatted.code,
  });
}

function buildName(profile: ProfileRow | null, user: User) {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  const firstAndLast = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    profile?.display_name?.trim() ||
    firstAndLast ||
    metadataName?.trim() ||
    user.email ||
    "Usuário"
  );
}

function isActiveStatus(status: string | null | undefined) {
  if (!status) {
    return true;
  }

  return !inactiveStatuses.has(status.trim().toLowerCase());
}

function getEffectiveStatus(
  profile: ProfileRow | null,
  access: ClientAccessRow | null,
) {
  return access?.status || profile?.status || "active";
}

function normalizeProgramOverrides(overrides: ProgramOverrideRow[]) {
  const accessibleProgramIds = overrides
    .filter((override) => override.program_id && override.mode !== "deny")
    .map((override) => override.program_id);

  const blockedProgramIds = overrides
    .filter((override) => override.program_id && override.mode === "deny")
    .map((override) => override.program_id);

  return {
    accessibleProgramIds,
    blockedProgramIds,
  };
}

export async function getCurrentClient(): Promise<CurrentClient | null> {
  const user = await getSupabaseCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return null;
  }

  const [profileResult, accessResult, overridesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, email, first_name, last_name, avatar_url, status, last_login_at",
      )
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("client_access")
      .select("id, user_id, plan, status, source_role, created_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("user_program_overrides")
      .select("program_id, mode")
      .eq("user_id", user.id),
  ]);

  if (profileResult.error) {
    logSupabaseError(
      "[current-client] Erro ao buscar profile:",
      profileResult.error,
    );

    return null;
  }

  if (accessResult.error) {
    logSupabaseError(
      "[current-client] Erro ao buscar client_access:",
      accessResult.error,
    );
  }

  if (overridesResult.error) {
    logSupabaseError(
      "[current-client] Erro ao buscar overrides de programa:",
      overridesResult.error,
    );
  }

  const profile = (profileResult.data as ProfileRow | null) ?? null;

  if (!profile) {
    if (warnedMissingProfileForUserId !== user.id) {
      warnedMissingProfileForUserId = user.id;

      console.warn(
        `[current-client] Profile não encontrado no Supabase para o usuário ${user.id}.`,
      );
    }

    return null;
  }

  const access = (accessResult.data as ClientAccessRow | null) ?? null;

  /*
    client_access é a fonte oficial do plano.
    Se não houver registro em client_access, o fallback seguro é Free.
  */
  const plan = normalizeClientPlan(resolveClientPlanFromAccess(access));
  const isPremium = isPremiumClientPlan(plan);
  const effectiveStatus = getEffectiveStatus(profile, access);
  const isActive = isActiveStatus(effectiveStatus);

  const overrides = ((overridesResult.data ?? []) as ProgramOverrideRow[]).filter(
    (override) => override.program_id,
  );

  const { accessibleProgramIds, blockedProgramIds } =
    normalizeProgramOverrides(overrides);

  const name = buildName(profile, user);

  return {
    id: profile.id,
    authUserId: user.id,
    email: profile.email ?? user.email ?? "",
    name,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    status: effectiveStatus,
    profileStatus: profile.status,
    accessStatus: access?.status ?? null,
    isActive,
    plan,
    planLabel: getClientPlanLabel(plan),
    isPremium,
    accessibleProgramIds,
    blockedProgramIds,
    full_name: name,
    hasPremiumAccess: isPremium,
  };
}