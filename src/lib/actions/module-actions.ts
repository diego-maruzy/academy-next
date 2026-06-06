"use server";

import { revalidatePath } from "next/cache";
import { moduleSchema, type ModuleInput } from "@/lib/validations/module";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

function getValidationError(message?: string) {
  return message ?? "Dados inválidos para o módulo.";
}

function resolveCoverImageUrl(
  nextValue: string | null | undefined,
  existingValue?: string | null,
) {
  if (nextValue !== undefined) {
    return nextValue ?? null;
  }

  return existingValue ?? null;
}

function normalizeModuleData(
  data: ModuleInput,
  existingCoverImageUrl?: string | null,
) {
  return {
    program_id: data.program_id,
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    display_order: data.display_order,
    cover_image_url: resolveCoverImageUrl(
      data.cover_image_url,
      existingCoverImageUrl,
    ),
  };
}

async function slugExists(programId: string, slug: string, ignoreId?: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { exists: false, error: "Supabase não configurado." };
  }

  let query = supabase
    .from("modules")
    .select("id")
    .eq("program_id", programId)
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

async function getProgramSlug(programId: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("programs")
    .select("slug")
    .eq("id", programId)
    .maybeSingle();

  return data?.slug ?? null;
}

async function revalidateModulePaths(programId: string) {
  const programSlug = await getProgramSlug(programId);

  revalidatePath("/programas");
  revalidatePath("/admin/programas");
  revalidatePath(`/admin/programas/${programId}`);

  if (programSlug) {
    revalidatePath(`/programas/${programSlug}`);
  }
}

export async function createModule(data: ModuleInput): Promise<ActionResult> {
  // TODO: proteger esta action com Keycloak/admin_access antes de produção.
  const parsed = moduleSchema.safeParse(data);

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

  const slugCheck = await slugExists(parsed.data.program_id, parsed.data.slug);

  if (slugCheck.error) {
    return { success: false, error: slugCheck.error };
  }

  if (slugCheck.exists) {
    return {
      success: false,
      error: "Já existe um módulo com este slug neste programa.",
    };
  }

  const { data: createdModule, error } = await supabase
    .from("modules")
    .insert(normalizeModuleData(parsed.data))
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await revalidateModulePaths(parsed.data.program_id);
  return { success: true, id: createdModule.id };
}

export async function updateModule(
  id: string,
  data: ModuleInput,
): Promise<ActionResult> {
  // TODO: proteger esta action com Keycloak/admin_access antes de produção.
  const parsed = moduleSchema.safeParse(data);

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

  const slugCheck = await slugExists(
    parsed.data.program_id,
    parsed.data.slug,
    id,
  );

  if (slugCheck.error) {
    return { success: false, error: slugCheck.error };
  }

  if (slugCheck.exists) {
    return {
      success: false,
      error: "Já existe um módulo com este slug neste programa.",
    };
  }

  const { data: existingModule, error: existingModuleError } = await supabase
    .from("modules")
    .select("cover_image_url")
    .eq("id", id)
    .single();

  if (existingModuleError) {
    return { success: false, error: existingModuleError.message };
  }

  const { error } = await supabase
    .from("modules")
    .update(
      normalizeModuleData(parsed.data, existingModule?.cover_image_url),
    )
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  await revalidateModulePaths(parsed.data.program_id);
  revalidatePath(`/admin/programas/${parsed.data.program_id}/modulos/${id}`);
  return { success: true, id };
}

export async function deleteModule(
  id: string,
  programId: string,
): Promise<ActionResult> {
  // TODO: proteger esta action com Keycloak/admin_access antes de produção.
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { error: lessonsError } = await supabase
    .from("lessons")
    .delete()
    .eq("module_id", id);

  if (lessonsError) {
    return { success: false, error: lessonsError.message };
  }

  const { error } = await supabase.from("modules").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  await revalidateModulePaths(programId);
  return { success: true, id };
}
