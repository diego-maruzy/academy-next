"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { isAdmin } from "@/lib/admin-auth/permissions";
import { slugify } from "@/lib/slugify";
import { createSupabaseServiceServerClient, getSupabaseActionErrorMessage } from "@/lib/supabase/server";
import { detectVideoProvider } from "@/lib/video-embed";
import { shortSchema, type ShortInput } from "@/lib/validations/short";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

function revalidateShortPaths() {
  revalidatePath("/shorts");
  revalidatePath("/admin/shorts");
}

async function assertAdmin(): Promise<ActionResult | null> {
  const admin = await getCurrentAdmin();

  if (!admin || !isAdmin(admin)) {
    return { success: false, error: "Acesso não autorizado." };
  }

  return null;
}

function normalizeShortInput(data: ShortInput): ShortInput {
  const detectedProvider = detectVideoProvider(data.video_url);
  const provider =
    data.video_provider ?? detectedProvider ?? ("vimeo" as const);

  return {
    ...data,
    title: data.title.trim(),
    slug: data.slug.trim(),
    description: data.description?.trim() || null,
    category: data.category?.trim() || null,
    video_url: data.video_url.trim(),
    video_provider: provider,
    thumbnail_url: data.thumbnail_url?.trim() || null,
    duration_label: data.duration_label?.trim() || null,
    cta_label: data.cta_label?.trim() || null,
    cta_url: data.cta_url?.trim() || null,
  };
}

async function slugExists(slug: string, ignoreId?: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { exists: false, error: "Supabase não configurado." };
  }

  let query = supabase.from("academy_shorts").select("id").eq("slug", slug).limit(1);

  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data, error } = await query;

  if (error) {
    return { exists: false, error: error.message };
  }

  return { exists: Boolean(data?.length) };
}

export async function createShort(data: ShortInput): Promise<ActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;

  const parsed = shortSchema.safeParse({
    ...data,
    slug: data.slug?.trim() || slugify(data.title),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const payload = normalizeShortInput(parsed.data);
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const slugCheck = await slugExists(payload.slug);
  if (slugCheck.error) return { success: false, error: slugCheck.error };
  if (slugCheck.exists) {
    return { success: false, error: "Já existe um short com este slug." };
  }

  const { data: created, error } = await supabase
    .from("academy_shorts")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: getSupabaseActionErrorMessage(error) };
  }

  revalidateShortPaths();
  return { success: true, id: created.id };
}

export async function updateShort(
  id: string,
  data: ShortInput,
): Promise<ActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;

  const parsed = shortSchema.safeParse({
    ...data,
    slug: data.slug?.trim() || slugify(data.title),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const payload = normalizeShortInput(parsed.data);
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const slugCheck = await slugExists(payload.slug, id);
  if (slugCheck.error) return { success: false, error: slugCheck.error };
  if (slugCheck.exists) {
    return { success: false, error: "Já existe um short com este slug." };
  }

  const { error } = await supabase
    .from("academy_shorts")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: getSupabaseActionErrorMessage(error) };
  }

  revalidateShortPaths();
  revalidatePath(`/admin/shorts/${id}/editar`);
  return { success: true, id };
}

export async function deleteShort(id: string): Promise<ActionResult> {
  const authError = await assertAdmin();
  if (authError) return authError;

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { error } = await supabase.from("academy_shorts").delete().eq("id", id);

  if (error) {
    return { success: false, error: getSupabaseActionErrorMessage(error) };
  }

  revalidateShortPaths();
  return { success: true, id };
}
