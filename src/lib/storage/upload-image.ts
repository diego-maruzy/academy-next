"use server";

import { createSupabaseServiceServerClient } from "@/lib/supabase/server";

export type ImageFolder = "programs" | "modules" | "lessons";

/**
 * Bucket usado para capas e imagens novas.
 * Crie o bucket `program-covers` no Supabase Storage e deixe público por enquanto.
 */
const BUCKET_NAME = "program-covers";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type UploadResult = {
  success: boolean;
  publicUrl?: string;
  error?: string;
};

function getFileExtension(filename: string) {
  const parts = filename.split(".");
  const extension = parts.at(-1)?.toLowerCase();

  if (!extension || extension === filename.toLowerCase()) {
    return "jpg";
  }

  return extension.replace(/[^a-z0-9]/g, "") || "jpg";
}

function sanitizeFilename(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

export async function uploadImageToSupabaseStorage(
  formData: FormData,
  folder: ImageFolder,
): Promise<UploadResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Nenhum arquivo selecionado." };
  }

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "Selecione um arquivo de imagem válido." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "A imagem deve ter no máximo 5 MB.",
    };
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const extension = getFileExtension(file.name);
  const timestamp = Date.now();
  const safeName = sanitizeFilename(file.name);
  const storagePath = `${folder}/${timestamp}-${safeName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    const message = uploadError.message.includes("Bucket not found")
      ? "Bucket program-covers não encontrado. Crie o bucket program-covers no Supabase Storage e deixe público por enquanto."
      : uploadError.message;

    return {
      success: false,
      error: `Não foi possível enviar a imagem: ${message}`,
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
