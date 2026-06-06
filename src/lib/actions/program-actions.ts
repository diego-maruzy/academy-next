"use server";

import { revalidatePath } from "next/cache";
import { programSchema, type ProgramInput } from "@/lib/validations/program";
import { createSupabaseServiceServerClient, getSupabaseActionErrorMessage } from "@/lib/supabase/server";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

function getValidationError(message?: string) {
  return message ?? "Dados inválidos para o programa.";
}

function revalidateProgramPaths() {
  revalidatePath("/programas");
  revalidatePath("/admin/programas");
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

function normalizeProgramData(
  data: ProgramInput,
  existingCoverImageUrl?: string | null,
) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    published: data.published,
    display_order: data.display_order,
    is_premium: data.is_premium,
    cover_image_url: resolveCoverImageUrl(
      data.cover_image_url,
      existingCoverImageUrl,
    ),
  };
}

async function slugExists(slug: string, ignoreId?: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { exists: false, error: "Supabase não configurado." };
  }

  let query = supabase.from("programs").select("id").eq("slug", slug).limit(1);

  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data, error } = await query;

  if (error) {
    return { exists: false, error: error.message };
  }

  return { exists: Boolean(data?.length) };
}

export async function createProgram(data: ProgramInput): Promise<ActionResult> {
  // TODO: proteger esta action com Keycloak/admin_access antes de produção.
  const parsed = programSchema.safeParse(data);

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
    return { success: false, error: "Já existe um programa com este slug." };
  }

  const { data: createdProgram, error } = await supabase
    .from("programs")
    .insert(normalizeProgramData(parsed.data))
    .select("id")
    .single();

  if (error) {
    return { success: false, error: getSupabaseActionErrorMessage(error) };
  }

  revalidateProgramPaths();
  return { success: true, id: createdProgram.id };
}

export async function updateProgram(
  id: string,
  data: ProgramInput,
): Promise<ActionResult> {
  // TODO: proteger esta action com Keycloak/admin_access antes de produção.
  const parsed = programSchema.safeParse(data);

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
    return { success: false, error: "Já existe um programa com este slug." };
  }

  const { data: existingProgram, error: existingProgramError } = await supabase
    .from("programs")
    .select("cover_image_url")
    .eq("id", id)
    .single();

  if (existingProgramError) {
    return { success: false, error: existingProgramError.message };
  }

  const { error } = await supabase
    .from("programs")
    .update(
      normalizeProgramData(parsed.data, existingProgram?.cover_image_url),
    )
    .eq("id", id);

  if (error) {
    return { success: false, error: getSupabaseActionErrorMessage(error) };
  }

  revalidateProgramPaths();
  revalidatePath(`/admin/programas/${id}`);
  return { success: true, id };
}

export async function deleteProgram(id: string): Promise<ActionResult> {
  // TODO: proteger esta action com Keycloak/admin_access antes de produção.
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { data: modules, error: modulesFetchError } = await supabase
    .from("modules")
    .select("id")
    .eq("program_id", id);

  if (modulesFetchError) {
    return { success: false, error: modulesFetchError.message };
  }

  const moduleIds = modules?.map((programModule) => programModule.id) ?? [];

  if (moduleIds.length > 0) {
    const { error: lessonsError } = await supabase
      .from("lessons")
      .delete()
      .in("module_id", moduleIds);

    if (lessonsError) {
      return { success: false, error: lessonsError.message };
    }

    const { error: modulesError } = await supabase
      .from("modules")
      .delete()
      .eq("program_id", id);

    if (modulesError) {
      return { success: false, error: modulesError.message };
    }
  }

  const { error } = await supabase.from("programs").delete().eq("id", id);

  if (error) {
    return { success: false, error: getSupabaseActionErrorMessage(error) };
  }

  revalidateProgramPaths();
  return { success: true, id };
}
