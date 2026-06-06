import {
  createSupabaseReadServerClient,
  createSupabaseServiceServerClient,
  formatSupabaseError,
} from "@/lib/supabase/server";
import type { AcademyShort } from "@/types/shorts";

const shortColumns =
  "id, title, slug, description, category, video_url, video_provider, thumbnail_url, duration_label, cta_label, cta_url, published, featured, display_order, created_at, updated_at";

function logShortsError(context: string, error: unknown) {
  console.error(`[shorts-data] ${context}`, formatSupabaseError(error));
}

export async function getPublishedShorts(): Promise<AcademyShort[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("academy_shorts")
    .select(shortColumns)
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    logShortsError("Erro ao buscar shorts publicados", error);
    return [];
  }

  return (data ?? []) as AcademyShort[];
}

export async function getAllShorts(): Promise<AcademyShort[]> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("academy_shorts")
    .select(shortColumns)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    logShortsError("Erro ao buscar shorts", error);
    return [];
  }

  return (data ?? []) as AcademyShort[];
}

export async function getShortById(id: string): Promise<AcademyShort | null> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("academy_shorts")
    .select(shortColumns)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logShortsError("Erro ao buscar short", error);
    return null;
  }

  return (data as AcademyShort | null) ?? null;
}

export async function getShortBySlug(slug: string): Promise<AcademyShort | null> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("academy_shorts")
    .select(shortColumns)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    logShortsError("Erro ao buscar short por slug", error);
    return null;
  }

  return (data as AcademyShort | null) ?? null;
}
