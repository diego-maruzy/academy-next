"use server";

import { createSupabaseServiceServerClient } from "@/lib/supabase/server";

/**
 * Bucket dedicado aos vídeos de Reels.
 * Crie o bucket `reels` no Supabase Storage e deixe público para leitura.
 */
const BUCKET_NAME = "reels";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

type UploadResult = {
  success: boolean;
  publicUrl?: string;
  error?: string;
};

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  const extension = parts.at(-1)?.toLowerCase();

  if (!extension || extension === filename.toLowerCase()) {
    return "mp4";
  }

  return extension.replace(/[^a-z0-9]/g, "") || "mp4";
}

function sanitizeFilename(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function isAllowedVideo(file: File) {
  if (ALLOWED_MIME_TYPES.has(file.type)) {
    return true;
  }

  const extension = getFileExtension(file.name);
  return extension === "mp4" || extension === "webm" || extension === "mov";
}

export async function uploadVideoToSupabaseStorage(
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Nenhum arquivo selecionado." };
  }

  if (!isAllowedVideo(file)) {
    return {
      success: false,
      error: "Selecione um vídeo válido (.mp4, .webm ou .mov).",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "O vídeo deve ter no máximo 100 MB.",
    };
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const extension = getFileExtension(file.name);
  const timestamp = Date.now();
  const safeName = sanitizeFilename(file.name);
  const storagePath = `${timestamp}-${safeName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type || `video/${extension === "mov" ? "quicktime" : extension}`,
      upsert: false,
    });

  if (uploadError) {
    const message = uploadError.message.includes("Bucket not found")
      ? "Bucket reels não encontrado. Crie o bucket reels no Supabase Storage e deixe público por enquanto."
      : uploadError.message;

    return {
      success: false,
      error: `Não foi possível enviar o vídeo: ${message}`,
    };
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

  if (!data.publicUrl) {
    return {
      success: false,
      error: "Upload concluído, mas não foi possível obter a URL pública.",
    };
  }

  return { success: true, publicUrl: data.publicUrl };
}
