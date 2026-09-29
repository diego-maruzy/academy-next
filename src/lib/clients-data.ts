import {
  createSupabaseReadServerClient,
  formatSupabaseError,
} from "@/lib/supabase/server";
import {
  getClientPlanLabel,
  isPremiumClientPlan,
  normalizeClientPlan,
  resolveClientPlanFromAccess,
  type ClientAccessRow,
  type ClientPlan,
} from "@/lib/clients/client-access";

const ADMIN_TEAM_ROLES = ["admin", "academy_manager", "academy_editor"];

export type ClientRow = {
  id: string;
  email: string;
  display_name: string;
  full_name: string;
  whatsapp: string | null;
  status: string;
  profileStatus: string;
  accessStatus: string;
  plan: ClientPlan;
  planLabel: "Free" | "Premium";
  isPremium: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  source: string | null;
  program_id: string | null;
  notes: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string | null;
  whatsapp: string | null;
  auth_provider: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  last_login_at: string | null;
};

type UserRoleRow = {
  user_id: string;
  role: string;
};

function logProfilesError(context: string, error: unknown) {
  const formatted = formatSupabaseError(error);

  console.error(context, {
    message: formatted.message,
    details: formatted.details,
    hint: formatted.hint,
    code: formatted.code,
  });
}

function getProfileName(profile: ProfileRow) {
  const fallbackName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    profile.display_name?.trim() ||
    fallbackName ||
    profile.email ||
    "Cliente sem nome"
  );
}

function getAccessStatus(profile: ProfileRow, access: ClientAccessRow | null) {
  return access?.status || profile.status || "active";
}

function mapProfileToClientRow(
  profile: ProfileRow,
  access: ClientAccessRow | null,
): ClientRow {
  const displayName = getProfileName(profile);
  const plan = resolveClientPlanFromAccess(access);
  const accessStatus = getAccessStatus(profile, access);
  const profileStatus = profile.status || "active";

  return {
    id: profile.id,
    email: profile.email ?? "",
    display_name: displayName,
    full_name: displayName,
    whatsapp: profile.whatsapp,
    status: accessStatus,
    profileStatus,
    accessStatus,
    plan,
    planLabel: getClientPlanLabel(plan),
    isPremium: isPremiumClientPlan(plan),
    created_at: profile.created_at,
    updated_at: profile.updated_at ?? profile.created_at,
    last_login_at: profile.last_login_at,
    source: profile.auth_provider,
    program_id: null,
    notes: null,
  };
}

async function fetchClientAccessByUserIds(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueUserIds.length === 0) {
    return new Map<string, ClientAccessRow>();
  }

  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return new Map<string, ClientAccessRow>();
  }

  const { data, error } = await supabase
    .from("client_access")
    .select("id, user_id, plan, status, source_role, created_at, updated_at")
    .in("user_id", uniqueUserIds);

  if (error) {
    logProfilesError("[client-access] Erro ao buscar planos:", error);
    return new Map<string, ClientAccessRow>();
  }

  return new Map(
    ((data ?? []) as ClientAccessRow[]).map((row) => [row.user_id, row]),
  );
}

async function fetchAdminTeamUserIds() {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("role", ADMIN_TEAM_ROLES);

  if (error) {
    logProfilesError("[clients-data] Erro ao buscar roles administrativas:", error);
    return new Set<string>();
  }

  return new Set(
    ((data ?? []) as UserRoleRow[])
      .filter((row) => ADMIN_TEAM_ROLES.includes(String(row.role)))
      .map((row) => row.user_id),
  );
}

export async function getClients(): Promise<ClientRow[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    console.error("Supabase não configurado para buscar clientes.");
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, email, created_at, updated_at, whatsapp, auth_provider, first_name, last_name, status, last_login_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    logProfilesError("[clients-data] Erro ao buscar profiles:", error);
    return [];
  }

  const profiles = (data ?? []) as ProfileRow[];

  const [accessByUserId, adminTeamUserIds] = await Promise.all([
    fetchClientAccessByUserIds(profiles.map((profile) => profile.id)),
    fetchAdminTeamUserIds(),
  ]);

  return profiles
    .filter((profile) => !adminTeamUserIds.has(profile.id))
    .map((profile) =>
      mapProfileToClientRow(profile, accessByUserId.get(profile.id) ?? null),
    );
}

export async function getClientById(id: string): Promise<ClientRow | null> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return null;
  }

  const [profileResult, accessByUserId, adminTeamUserIds] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, email, created_at, updated_at, whatsapp, auth_provider, first_name, last_name, status, last_login_at",
      )
      .eq("id", id)
      .maybeSingle(),
    fetchClientAccessByUserIds([id]),
    fetchAdminTeamUserIds(),
  ]);

  if (profileResult.error) {
    logProfilesError("[clients-data] Erro ao buscar profile:", profileResult.error);
    return null;
  }

  if (!profileResult.data) {
    return null;
  }

  if (adminTeamUserIds.has(id)) {
    return null;
  }

  return mapProfileToClientRow(
    profileResult.data as ProfileRow,
    accessByUserId.get(id) ?? null,
  );
}

export function getProgramNameFromClient(client: ClientRow) {
  void client;
  return null;
}

export function getClientPlanFromRow(row: ClientRow): ClientPlan {
  return normalizeClientPlan(row.plan);
}