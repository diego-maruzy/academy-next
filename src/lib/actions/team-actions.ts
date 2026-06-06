"use server";

import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/admin-auth/password";
import { teamMemberSchema, type TeamMemberInput } from "@/lib/validations/team";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

function getValidationError(message?: string) {
  return message ?? "Dados inválidos para o membro da equipe.";
}

function normalizeTeamMemberData(data: TeamMemberInput) {
  return {
    full_name: data.full_name,
    email: data.email,
    phone: data.phone ?? null,
    role: data.role,
    permission: data.permission,
    department: data.department ?? null,
    status: data.status,
    notes: data.notes ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function emailExists(email: string, ignoreId?: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { exists: false, error: "Supabase não configurado." };
  }

  let query = supabase
    .from("team_members")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data, error } = await query;

  if (error) {
    return { exists: false, error: error.message };
  }

  return { exists: Boolean(data?.length) };
}

export async function createTeamMember(
  data: TeamMemberInput,
): Promise<ActionResult> {
  // TODO: futuramente criar/sincronizar usuário no Keycloak.
  const parsed = teamMemberSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error.issues[0]?.message),
    };
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const emailCheck = await emailExists(parsed.data.email);

  if (emailCheck.error) {
    return { success: false, error: emailCheck.error };
  }

  if (emailCheck.exists) {
    return {
      success: false,
      error: "Já existe um membro da equipe com este email.",
    };
  }

  const insertData: Record<string, unknown> = normalizeTeamMemberData(
    parsed.data,
  );

  if (parsed.data.password) {
    insertData.password_hash = await hashPassword(parsed.data.password);
  }

  const { data: createdMember, error } = await supabase
    .from("team_members")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/equipe");
  return { success: true, id: createdMember.id };
}

export async function updateTeamMember(
  id: string,
  data: TeamMemberInput,
): Promise<ActionResult> {
  // TODO: futuramente criar/sincronizar usuário no Keycloak.
  const parsed = teamMemberSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error.issues[0]?.message),
    };
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const emailCheck = await emailExists(parsed.data.email, id);

  if (emailCheck.error) {
    return { success: false, error: emailCheck.error };
  }

  if (emailCheck.exists) {
    return {
      success: false,
      error: "Já existe um membro da equipe com este email.",
    };
  }

  const updateData: Record<string, unknown> = normalizeTeamMemberData(
    parsed.data,
  );

  if (parsed.data.newPassword) {
    updateData.password_hash = await hashPassword(parsed.data.newPassword);
  }

  const { error } = await supabase
    .from("team_members")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/equipe");
  return { success: true, id };
}

export async function deleteTeamMember(id: string): Promise<ActionResult> {
  // TODO: futuramente criar/sincronizar usuário no Keycloak.
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { error } = await supabase.from("team_members").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/equipe");
  return { success: true, id };
}
