"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import {
  webhookConnectionSchema,
  type WebhookConnectionInput,
} from "@/lib/validations/webhook";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
  secretToken?: string;
};

function getValidationError(message?: string) {
  return message ?? "Dados inválidos para a conexão.";
}

function generateSecretToken() {
  return randomBytes(32).toString("hex");
}

function normalizeWebhookData(
  data: WebhookConnectionInput,
  secretToken?: string | null,
) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    type: data.type,
    role: data.role,
    program_id: data.program_id ?? null,
    status: data.status,
    secret_token: secretToken ?? data.secret_token ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function slugExists(slug: string, ignoreId?: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { exists: false, error: "Supabase não configurado." };
  }

  let query = supabase
    .from("webhook_connections")
    .select("id")
    .eq("slug", slug)
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

export async function createWebhookConnection(
  data: WebhookConnectionInput,
): Promise<ActionResult> {
  const parsed = webhookConnectionSchema.safeParse(data);

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

  const slugCheck = await slugExists(parsed.data.slug);

  if (slugCheck.error) {
    return { success: false, error: slugCheck.error };
  }

  if (slugCheck.exists) {
    return { success: false, error: "Já existe uma conexão com este slug." };
  }

  const secretToken = generateSecretToken();

  const { data: createdConnection, error } = await supabase
    .from("webhook_connections")
    .insert(normalizeWebhookData(parsed.data, secretToken))
    .select("id, secret_token")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/conexoes");
  return {
    success: true,
    id: createdConnection.id,
    secretToken: createdConnection.secret_token ?? undefined,
  };
}

export async function updateWebhookConnection(
  id: string,
  data: WebhookConnectionInput,
): Promise<ActionResult> {
  const parsed = webhookConnectionSchema.safeParse(data);

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

  const slugCheck = await slugExists(parsed.data.slug, id);

  if (slugCheck.error) {
    return { success: false, error: slugCheck.error };
  }

  if (slugCheck.exists) {
    return { success: false, error: "Já existe uma conexão com este slug." };
  }

  const { data: existingConnection, error: existingError } = await supabase
    .from("webhook_connections")
    .select("secret_token")
    .eq("id", id)
    .single();

  if (existingError) {
    return { success: false, error: existingError.message };
  }

  const { error } = await supabase
    .from("webhook_connections")
    .update(
      normalizeWebhookData(parsed.data, existingConnection?.secret_token),
    )
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/conexoes");
  return { success: true, id };
}

export async function deleteWebhookConnection(id: string): Promise<ActionResult> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { error } = await supabase
    .from("webhook_connections")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/conexoes");
  return { success: true, id };
}

export async function regenerateWebhookSecret(id: string): Promise<ActionResult> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const secretToken = generateSecretToken();

  const { error } = await supabase
    .from("webhook_connections")
    .update({
      secret_token: secretToken,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/conexoes");
  return { success: true, id, secretToken };
}
