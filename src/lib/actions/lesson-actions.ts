"use server";

import { revalidatePath } from "next/cache";
import { lessonSchema, type LessonInput } from "@/lib/validations/lesson";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

function getValidationError(message?: string) {
  return message ?? "Dados inválidos para a aula.";
}

function resolveImageUrl(
  nextValue: string | null | undefined,
  existingValue?: string | null,
) {
  if (nextValue !== undefined) {
    return nextValue ?? null;
  }

  return existingValue ?? null;
}

function normalizeLessonData(
  data: LessonInput,
  existingImageUrl?: string | null,
) {
  return {
    module_id: data.module_id,
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    cta_url: data.cta_url ?? null,
    cta_text: data.cta_text || null,
    image_url: resolveImageUrl(data.image_url, existingImageUrl),
    vimeo_url: data.vimeo_url ?? null,
    display_order: data.display_order,
  };
}

async function slugExists(moduleId: string, slug: string, ignoreId?: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { exists: false, error: "Supabase não configurado." };
  }

  let query = supabase
    .from("lessons")
    .select("id")
    .eq("module_id", moduleId)
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

async function getModuleContext(moduleId: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("modules")
    .select("id, slug, program_id, programs(id, slug)")
    .eq("id", moduleId)
    .maybeSingle();

  const program = Array.isArray(data?.programs)
    ? data?.programs[0]
    : data?.programs;

  return data
    ? {
        moduleSlug: data.slug as string,
        programId: data.program_id as string,
        programSlug: program?.slug as string | undefined,
      }
    : null;
}

async function revalidateLessonPaths(moduleId: string) {
  const context = await getModuleContext(moduleId);

  revalidatePath("/programas");
  revalidatePath("/admin/programas");

  if (context) {
    revalidatePath(`/admin/programas/${context.programId}`);
    revalidatePath(`/admin/programas/${context.programId}/modulos/${moduleId}`);

    if (context.programSlug) {
      revalidatePath(`/programas/${context.programSlug}`);
      revalidatePath(
        `/programas/${context.programSlug}/modulos/${context.moduleSlug}`,
      );
    }
  }
}

export async function createLesson(data: LessonInput): Promise<ActionResult> {
  // TODO: proteger esta action com Keycloak/admin_access antes de produção.
  const parsed = lessonSchema.safeParse(data);

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

  const slugCheck = await slugExists(parsed.data.module_id, parsed.data.slug);

  if (slugCheck.error) {
    return { success: false, error: slugCheck.error };
  }

  if (slugCheck.exists) {
    return {
      success: false,
      error: "Já existe uma aula com este slug neste módulo.",
    };
  }

  const { data: createdLesson, error } = await supabase
    .from("lessons")
    .insert(normalizeLessonData(parsed.data))
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await revalidateLessonPaths(parsed.data.module_id);
  return { success: true, id: createdLesson.id };
}

export async function updateLesson(
  id: string,
  data: LessonInput,
): Promise<ActionResult> {
  // TODO: proteger esta action com Keycloak/admin_access antes de produção.
  const parsed = lessonSchema.safeParse(data);

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

  const slugCheck = await slugExists(parsed.data.module_id, parsed.data.slug, id);

  if (slugCheck.error) {
    return { success: false, error: slugCheck.error };
  }

  if (slugCheck.exists) {
    return {
      success: false,
      error: "Já existe uma aula com este slug neste módulo.",
    };
  }

  const { data: existingLesson, error: existingLessonError } = await supabase
    .from("lessons")
    .select("image_url")
    .eq("id", id)
    .single();

  if (existingLessonError) {
    return { success: false, error: existingLessonError.message };
  }

  const { error } = await supabase
    .from("lessons")
    .update(normalizeLessonData(parsed.data, existingLesson?.image_url))
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  await revalidateLessonPaths(parsed.data.module_id);
  return { success: true, id };
}

export async function deleteLesson(
  id: string,
  moduleId: string,
): Promise<ActionResult> {
  // TODO: proteger esta action com Keycloak/admin_access antes de produção.
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { error } = await supabase.from("lessons").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  await revalidateLessonPaths(moduleId);
  return { success: true, id };
}
