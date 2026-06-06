import { createSupabaseReadServerClient } from "@/lib/supabase/server";

export type TeamMemberRow = {
  id: string;
  keycloak_id: string | null;
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
};

export async function getTeamMembers(): Promise<TeamMemberRow[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    console.error("Supabase não configurado para buscar equipe.");
    return [];
  }

  const { data, error } = await supabase
    .from("team_members")
    .select(
      "id, keycloak_id, full_name, email, phone, role, permission, department, status, notes, created_at, updated_at, last_login_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar equipe:", error.message);
    return [];
  }

  return (data ?? []) as TeamMemberRow[];
}
