"use server";

import { revalidatePath } from "next/cache";
import {
  normalizeClientPlan,
  type ClientPlan,
} from "@/lib/clients/client-access";
import { clientSchema, type ClientInput } from "@/lib/validations/client";
import {
  createSupabaseServiceServerClient,
  formatSupabaseError,
} from "@/lib/supabase/server";

const DEFAULT_CLIENT_PASSWORD = "fliphouse2026";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

type ExistingProfileRow = {
  id: string;
};

function getValidationError(message?: string) {
  return message ?? "Dados inválidos para o aluno.";
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);

  return {
    first_name: parts[0] ?? null,
    last_name: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getDisplayName(data: ClientInput) {
  return data.full_name.trim();
}

function profilePayload(data: ClientInput) {
  const displayName = getDisplayName(data);

  return {
    display_name: displayName,
    email: normalizeEmail(data.email),
    whatsapp: data.phone ?? null,
    status: data.status,
    auth_provider: data.source ?? "manual",
    updated_at: new Date().toISOString(),
    ...splitName(displayName),
  };
}

function getActionError(error: unknown) {
  const formatted = formatSupabaseError(error);
  return formatted.message || "Erro inesperado.";
}

function logActionError(context: string, error: unknown) {
  const formatted = formatSupabaseError(error);

  console.error(context, {
    message: formatted.message,
    details: formatted.details,
    hint: formatted.hint,
    code: formatted.code,
  });
}

async function emailExists(email: string, ignoreId?: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { exists: false, error: "Supabase não configurado." };
  }

  let query = supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizeEmail(email))
    .limit(1);

  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data, error } = await query;

  if (error) {
    return { exists: false, error: getActionError(error) };
  }

  return { exists: Boolean(data?.length) };
}

async function upsertClientAccess(input: {
  userId: string;
  plan: ClientPlan | string;
  status: string;
}) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." };
  }

  const normalizedPlan = normalizeClientPlan(input.plan);
  const now = new Date().toISOString();

  const { error } = await supabase.from("client_access").upsert(
    {
      user_id: input.userId,
      plan: normalizedPlan,
      status: input.status || "active",
      source_role: "manual_admin",
      updated_at: now,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    logActionError("[client-actions] Erro ao salvar client_access:", error);

    return {
      success: false as const,
      error: getActionError(error),
    };
  }

  return {
    success: true as const,
    plan: normalizedPlan,
  };
}

async function createAuthUserForClient(data: ClientInput) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return {
      success: false as const,
      error: "Supabase não configurado.",
      userId: null,
    };
  }

  const email = normalizeEmail(data.email);
  const displayName = getDisplayName(data);

  const { data: authData, error } = await supabase.auth.admin.createUser({
    email,
    password: DEFAULT_CLIENT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      full_name: displayName,
      plan: normalizeClientPlan(data.plan),
      source: "manual_admin",
    },
  });

  if (error) {
    logActionError("[client-actions] Erro ao criar usuário Auth:", error);

    return {
      success: false as const,
      error: getActionError(error),
      userId: null,
    };
  }

  if (!authData.user?.id) {
    return {
      success: false as const,
      error: "Usuário Auth criado sem ID.",
      userId: null,
    };
  }

  return {
    success: true as const,
    userId: authData.user.id,
  };
}

async function upsertProfileForClient(userId: string, data: ClientInput) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return {
      success: false as const,
      error: "Supabase não configurado.",
    };
  }

  const payload = profilePayload(data);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      created_at: new Date().toISOString(),
      ...payload,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    logActionError("[client-actions] Erro ao salvar profile:", error);

    return {
      success: false as const,
      error: getActionError(error),
    };
  }

  return {
    success: true as const,
  };
}

async function updateAuthUserForClient(id: string, data: ClientInput) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return {
      success: false as const,
      error: "Supabase não configurado.",
    };
  }

  const email = normalizeEmail(data.email);
  const displayName = getDisplayName(data);

  const { error } = await supabase.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      full_name: displayName,
      plan: normalizeClientPlan(data.plan),
      source: "manual_admin",
    },
  });

  if (error) {
    /*
      Alguns profiles antigos podem não existir em auth.users por causa da migração.
      Nesse caso, não vamos impedir a edição do cadastro/profile.
      O login desses usuários precisa ser tratado pelo script de sincronização de Auth.
    */
    logActionError(
      "[client-actions] Aviso: não foi possível atualizar usuário Auth:",
      error,
    );

    return {
      success: true as const,
      warning: getActionError(error),
    };
  }

  return {
    success: true as const,
  };
}

async function getExistingProfile(id: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return {
      data: null,
      error: "Supabase não configurado.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: getActionError(error),
    };
  }

  return {
    data: data as ExistingProfileRow | null,
    error: null,
  };
}

export async function createClient(data: ClientInput): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(data);

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
    return { success: false, error: "Já existe um aluno com este email." };
  }

  const authResult = await createAuthUserForClient(parsed.data);

  if (!authResult.success || !authResult.userId) {
    return {
      success: false,
      error: authResult.error || "Não foi possível criar o usuário Auth.",
    };
  }

  const profileResult = await upsertProfileForClient(
    authResult.userId,
    parsed.data,
  );

  if (!profileResult.success) {
    return {
      success: false,
      error: profileResult.error,
    };
  }

  const accessResult = await upsertClientAccess({
    userId: authResult.userId,
    plan: parsed.data.plan,
    status: parsed.data.status,
  });

  if (!accessResult.success) {
    return {
      success: false,
      error: accessResult.error,
    };
  }

  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  return {
    success: true,
    id: authResult.userId,
  };
}

export async function updateClient(
  id: string,
  data: ClientInput,
): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(data);

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

  const existingProfile = await getExistingProfile(id);

  if (existingProfile.error) {
    return {
      success: false,
      error: existingProfile.error,
    };
  }

  if (!existingProfile.data) {
    return {
      success: false,
      error: "Cliente não encontrado.",
    };
  }

  const emailCheck = await emailExists(parsed.data.email, id);

  if (emailCheck.error) {
    return { success: false, error: emailCheck.error };
  }

  if (emailCheck.exists) {
    return { success: false, error: "Já existe um aluno com este email." };
  }

  const { error } = await supabase
    .from("profiles")
    .update(profilePayload(parsed.data))
    .eq("id", id);

  if (error) {
    logActionError("[client-actions] Erro ao atualizar profile:", error);

    return {
      success: false,
      error: getActionError(error),
    };
  }

  await updateAuthUserForClient(id, parsed.data);

  const accessResult = await upsertClientAccess({
    userId: id,
    plan: parsed.data.plan,
    status: parsed.data.status,
  });

  if (!accessResult.success) {
    return {
      success: false,
      error: accessResult.error,
    };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    id,
  };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { error: accessError } = await supabase
    .from("client_access")
    .delete()
    .eq("user_id", id);

  if (accessError) {
    logActionError("[client-actions] Erro ao remover client_access:", accessError);

    return {
      success: false,
      error: getActionError(accessError),
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (profileError) {
    logActionError("[client-actions] Erro ao remover profile:", profileError);

    return {
      success: false,
      error: getActionError(profileError),
    };
  }

  /*
    Não deletamos auth.users automaticamente.
    Isso evita remover usuários por engano em caso de dados migrados.
    Se quiser remover também do Auth, criar uma ação separada e explícita.
  */

  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  return {
    success: true,
    id,
  };
}