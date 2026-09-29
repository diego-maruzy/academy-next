import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSupabaseReadServerClient,
  createSupabaseServiceServerClient,
  formatSupabaseError,
} from "@/lib/supabase/server";
import type { AcademyShort } from "@/types/shorts";

const reelColumns = `
  id,
  title,
  description,
  video_url,
  video_provider,
  thumbnail_url,
  status,
  order_index,
  is_featured,
  created_at,
  updated_at,
  video_source,
  storage_bucket,
  storage_path,
  video_public_url,
  file_name,
  file_size,
  mime_type,
  duration_seconds,
  poster_url
`;

type ReelRow = {
  id: string;
  title: string | null;
  description: string | null;
  video_url: string | null;
  video_provider: string | null;
  thumbnail_url: string | null;
  status: string | null;
  order_index: number | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  video_source: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  video_public_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  poster_url: string | null;
};

function logShortsError(context: string, error: unknown) {
  console.error(`[shorts-data] ${context}`, formatSupabaseError(error));
}

function formatDurationLabel(durationSeconds: number | null): string | null {
  if (!durationSeconds) {
    return null;
  }

  const totalSeconds = Math.floor(Number(durationSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function resolveStorageVideoUrl(
  supabase: SupabaseClient,
  reel: ReelRow,
): Promise<string> {
  if (reel.video_public_url) {
    return reel.video_public_url;
  }

  if (reel.video_url) {
    return reel.video_url;
  }

  if (!reel.storage_bucket || !reel.storage_path) {
    return "";
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(reel.storage_bucket)
    .createSignedUrl(reel.storage_path, 60 * 60);

  if (!signedError && signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const { data: publicData } = supabase.storage
    .from(reel.storage_bucket)
    .getPublicUrl(reel.storage_path);

  return publicData.publicUrl || "";
}

async function resolvePosterUrl(
  supabase: SupabaseClient,
  reel: ReelRow,
): Promise<string> {
  if (reel.poster_url) {
    return reel.poster_url;
  }

  if (reel.thumbnail_url) {
    return reel.thumbnail_url;
  }

  return "";
}

async function mapReelToAcademyShort(
  supabase: SupabaseClient,
  reel: ReelRow,
): Promise<AcademyShort> {
  const videoUrl = await resolveStorageVideoUrl(supabase, reel);
  const thumbnailUrl = await resolvePosterUrl(supabase, reel);

  return {
    id: reel.id,
    title: reel.title ?? "",
    slug: reel.id,
    description: reel.description ?? "",
    category: reel.video_source ?? reel.video_provider ?? "reel",
    video_url: videoUrl,
    video_provider: reel.video_provider ?? reel.video_source ?? "video",
    thumbnail_url: thumbnailUrl,
    duration_label: formatDurationLabel(reel.duration_seconds),
    cta_label: null,
    cta_url: null,
    published: reel.status === "published",
    featured: Boolean(reel.is_featured),
    display_order: reel.order_index ?? 0,
    created_at: reel.created_at,
    updated_at: reel.updated_at,
  } as AcademyShort;
}

async function mapReelsToAcademyShorts(
  supabase: SupabaseClient,
  reels: ReelRow[],
): Promise<AcademyShort[]> {
  return Promise.all(reels.map((reel) => mapReelToAcademyShort(supabase, reel)));
}

export async function getPublishedShorts(): Promise<AcademyShort[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("reels")
    .select(reelColumns)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    logShortsError("Erro ao buscar shorts publicados", error);
    return [];
  }

  return mapReelsToAcademyShorts(supabase, (data ?? []) as ReelRow[]);
}

export async function getAllShorts(): Promise<AcademyShort[]> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("reels")
    .select(reelColumns)
    .order("is_featured", { ascending: false })
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    logShortsError("Erro ao buscar shorts", error);
    return [];
  }

  return mapReelsToAcademyShorts(supabase, (data ?? []) as ReelRow[]);
}

export async function getShortById(id: string): Promise<AcademyShort | null> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("reels")
    .select(reelColumns)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logShortsError("Erro ao buscar short", error);
    return null;
  }

  return data ? mapReelToAcademyShort(supabase, data as ReelRow) : null;
}

export async function getShortBySlug(slug: string): Promise<AcademyShort | null> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("reels")
    .select(reelColumns)
    .eq("id", slug)
    .maybeSingle();

  if (error) {
    logShortsError("Erro ao buscar short por slug", error);
    return null;
  }

  return data ? mapReelToAcademyShort(supabase, data as ReelRow) : null;
}