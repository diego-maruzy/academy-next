import { TEAM_USER_ROLES } from "@/lib/team/team-roles";
import { createSupabaseReadServerClient } from "@/lib/supabase/server";

export type TeamMemberRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  permission: string;
  department: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  avatar_url: string | null;
};

type UserRoleRow = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  status: string | null;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function formatSupabaseError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const supabaseError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    return {
      message: supabaseError.message,
      details: supabaseError.details,
      hint: supabaseError.hint,
      code: supabaseError.code,
    };
  }

  return error;
}

function getProfileName(profile: ProfileRow | undefined): string {
  if (!profile) {
    return "Sem nome";
  }

  if (profile.display_name?.trim()) {
    return profile.display_name.trim();
  }

  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Sem nome";
}

export async function getTeamMembers(): Promise<TeamMemberRow[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    console.error("Supabase não configurado para buscar equipe.");
    return [];
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("id, user_id, role, created_at")
    .in("role", TEAM_USER_ROLES)
    .order("created_at", { ascending: false });

  if (rolesError) {
    console.error(
      "Erro ao buscar roles da equipe:",
      formatSupabaseError(rolesError),
    );
    return [];
  }

  const roleRows = (roles ?? []) as UserRoleRow[];

  if (roleRows.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(roleRows.map((role) => role.user_id).filter(Boolean)),
  );

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(
      "id, display_name, email, first_name, last_name, whatsapp, avatar_url, status, last_login_at, created_at, updated_at",
    )
    .in("id", userIds);

  if (profilesError) {
    console.error(
      "Erro ao buscar profiles da equipe:",
      formatSupabaseError(profilesError),
    );
  }

  const profilesMap = new Map<string, ProfileRow>(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );

  return roleRows.map((role) => {
    const profile = profilesMap.get(role.user_id);
    const profileCreatedAt = profile?.created_at ?? role.created_at;
    const profileUpdatedAt = profile?.updated_at ?? profileCreatedAt;

    return {
      id: role.id,
      user_id: role.user_id,
      full_name: getProfileName(profile),
      email: profile?.email ?? "",
      phone: profile?.whatsapp ?? null,
      role: role.role,
      permission: role.role,
      department: null,
      status: profile?.status ?? "active",
      notes: null,
      created_at: role.created_at,
      updated_at: profileUpdatedAt,
      last_login_at: profile?.last_login_at ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}