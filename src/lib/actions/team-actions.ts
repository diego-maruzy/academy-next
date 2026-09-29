"use server";

import { revalidatePath } from "next/cache";
import {
  formatTeamUserRole,
  normalizeTeamUserRole,
  TEAM_USER_ROLES,
  type TeamUserRole,
} from "@/lib/team/team-roles";
import { teamMemberSchema, type TeamMemberInput } from "@/lib/validations/team";
import {
  createSupabaseServiceServerClient,
  formatSupabaseError,
} from "@/lib/supabase/server";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

function getValidationError(message?: string) {
  return message ?? "Dados inválidos para o membro da equipe.";
}

function getActionError(error: unknown) {
  return formatSupabaseError(error).message;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] ?? null,
    last_name: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function buildProfilePayload(data: TeamMemberInput) {
  return {
    display_name: data.full_name.trim(),
    email: data.email.trim().toLowerCase(),
    whatsapp: data.phone ?? null,
    status: data.status,
    updated_at: new Date().toISOString(),
    ...splitName(data.full_name),
  };
}

async function emailExists(email: string, ignoreUserId?: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { exists: false, error: "Supabase não configurado." };
  }

  let query = supabase.from("profiles").select("id").eq("email", email).limit(1);

  if (ignoreUserId) {
    query = query.neq("id", ignoreUserId);
  }

  const { data, error } = await query;

  if (error) {
    return { exists: false, error: getActionError(error) };
  }

  return { exists: Boolean(data?.length) };
}

async function getTeamRoleRow(roleId: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { row: null, error: "Supabase não configurado." };
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("id, user_id, role")
    .eq("id", roleId)
    .maybeSingle();

  if (error) {
    return { row: null, error: getActionError(error) };
  }

  if (!data) {
    return { row: null, error: "Membro da equipe não encontrado." };
  }

  return {
    row: data as { id: string; user_id: string; role: string },
    error: null,
  };
}

async function updateAuthUserCredentials(
  userId: string,
  params: { email?: string; password?: string },
) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { error: "Supabase não configurado." };
  }

  const updatePayload: {
    email?: string;
    password?: string;
    email_confirm?: boolean;
  } = {};

  if (params.email) {
    updatePayload.email = params.email;
    updatePayload.email_confirm = true;
  }

  if (params.password) {
    updatePayload.password = params.password;
    updatePayload.email_confirm = true;
  }

  if (Object.keys(updatePayload).length === 0) {
    return { error: null };
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, updatePayload);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function createTeamMember(
  data: TeamMemberInput,
): Promise<ActionResult> {
  const parsed = teamMemberSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: getValidationError(parsed.error.issues[0]?.message),
    };
  }

  if (!parsed.data.password) {
    return {
      success: false,
      error: "Informe uma senha administrativa com pelo menos 8 caracteres.",
    };
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const emailCheck = await emailExists(email);

  if (emailCheck.error) {
    return { success: false, error: emailCheck.error };
  }

  if (emailCheck.exists) {
    return {
      success: false,
      error: "Já existe um usuário com este email.",
    };
  }

  const teamRole = normalizeTeamUserRole(parsed.data.permission);

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name.trim(),
      },
    });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message ?? "Não foi possível criar o usuário no Auth.",
    };
  }

  const userId = authData.user.id;
  const now = new Date().toISOString();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      ...buildProfilePayload(parsed.data),
      created_at: now,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    return { success: false, error: getActionError(profileError) };
  }

  const { data: createdRole, error: roleError } = await supabase
    .from("user_roles")
    .insert({
      user_id: userId,
      role: teamRole,
      created_at: now,
    })
    .select("id")
    .single();

  if (roleError || !createdRole) {
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    return {
      success: false,
      error: getActionError(roleError ?? "Não foi possível atribuir a role."),
    };
  }

  revalidatePath("/equipe");
  return { success: true, id: createdRole.id as string };
}

export async function updateTeamMember(
  roleId: string,
  data: TeamMemberInput,
): Promise<ActionResult> {
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

  const roleLookup = await getTeamRoleRow(roleId);

  if (roleLookup.error || !roleLookup.row) {
    return { success: false, error: roleLookup.error ?? "Membro não encontrado." };
  }

  const userId = roleLookup.row.user_id;
  const email = parsed.data.email.trim().toLowerCase();
  const emailCheck = await emailExists(email, userId);

  if (emailCheck.error) {
    return { success: false, error: emailCheck.error };
  }

  if (emailCheck.exists) {
    return {
      success: false,
      error: "Já existe um usuário com este email.",
    };
  }

  const teamRole = normalizeTeamUserRole(parsed.data.permission);

  if (!(TEAM_USER_ROLES as readonly string[]).includes(teamRole)) {
    return {
      success: false,
      error: `Permissão inválida. Use: ${TEAM_USER_ROLES.map(formatTeamUserRole).join(", ")}.`,
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(buildProfilePayload(parsed.data))
    .eq("id", userId);

  if (profileError) {
    return { success: false, error: getActionError(profileError) };
  }

  const { error: roleError } = await supabase
    .from("user_roles")
    .update({ role: teamRole as TeamUserRole })
    .eq("id", roleId);

  if (roleError) {
    return { success: false, error: getActionError(roleError) };
  }

  const authUpdate = await updateAuthUserCredentials(userId, {
    email,
    password: parsed.data.newPassword,
  });

  if (authUpdate.error) {
    return { success: false, error: authUpdate.error };
  }

  revalidatePath("/equipe");
  return { success: true, id: roleId };
}

export async function deleteTeamMember(roleId: string): Promise<ActionResult> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const roleLookup = await getTeamRoleRow(roleId);

  if (roleLookup.error || !roleLookup.row) {
    return { success: false, error: roleLookup.error ?? "Membro não encontrado." };
  }

  const { error } = await supabase.from("user_roles").delete().eq("id", roleId);

  if (error) {
    return { success: false, error: getActionError(error) };
  }

  revalidatePath("/equipe");
  return { success: true, id: roleId };
}
