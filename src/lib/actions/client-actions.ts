"use server";

import { revalidatePath } from "next/cache";
import { clientSchema, type ClientInput } from "@/lib/validations/client";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

function getValidationError(message?: string) {
  return message ?? "Dados inválidos para o cliente.";
}

function normalizeClientData(data: ClientInput) {
  return {
    full_name: data.full_name,
    email: data.email,
    phone: data.phone ?? null,
    role: data.role,
    status: data.status,
    source: data.source ?? null,
    program_id: data.program_id ?? null,
    notes: data.notes ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function emailExists(email: string, ignoreId?: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { exists: false, error: "Supabase não configurado." };
  }

  let query = supabase.from("clients").select("id").eq("email", email).limit(1);

  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data, error } = await query;

  if (error) {
    return { exists: false, error: error.message };
  }

  return { exists: Boolean(data?.length) };
}

export async function createClient(data: ClientInput): Promise<ActionResult> {
  // TODO: futuramente criar/sincronizar usuário no Keycloak.
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
    return { success: false, error: "Já existe um cliente com este email." };
  }

  const { data: createdClient, error } = await supabase
    .from("clients")
    .insert(normalizeClientData(parsed.data))
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/clientes");
  return { success: true, id: createdClient.id };
}

export async function updateClient(
  id: string,
  data: ClientInput,
): Promise<ActionResult> {
  // TODO: futuramente criar/sincronizar usuário no Keycloak.
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

  const emailCheck = await emailExists(parsed.data.email, id);

  if (emailCheck.error) {
    return { success: false, error: emailCheck.error };
  }

  if (emailCheck.exists) {
    return { success: false, error: "Já existe um cliente com este email." };
  }

  const { error } = await supabase
    .from("clients")
    .update(normalizeClientData(parsed.data))
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/clientes");
  return { success: true, id };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  // TODO: futuramente criar/sincronizar usuário no Keycloak.
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/clientes");
  return { success: true, id };
}
