import type { SupabaseClient } from "@supabase/supabase-js";

export const ADMIN_ROLE = "admin" as const;

export type UserRole = typeof ADMIN_ROLE;

export async function userHasAdminRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", ADMIN_ROLE)
    .maybeSingle();

  if (error) {
    console.error("[user-roles] Erro ao consultar role:", error.message);
    return false;
  }

  return Boolean(data);
}
