"use client";

import { Loader2, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { uploadVideoToSupabaseStorage } from "@/lib/storage/upload-video";
import { cn } from "@/lib/utils";

type VideoUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  error?: string;
};

export function VideoUploadField({
  value,
  onChange,
  helperText,
  error,
}: VideoUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError(null);

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(previewUrl);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadVideoToSupabaseStorage(formData);

    setIsUploading(false);

    if (!result.success || !result.publicUrl) {
      setUploadError(result.error ?? "Não foi possível enviar o vídeo.");
      return;
    }

    onChange(result.publicUrl);
  }

  function handleManualUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setUploadError(null);

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onChange(nextValue);
  }

  const previewSrc = localPreviewUrl || value;

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <div className="grid gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Enviar vídeo
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          disabled={isUploading}
          onChange={handleFileChange}
          className={cn(
            "h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-200 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/10",
            isUploading && "opacity-70",
          )}
        />
        {isUploading ? (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Enviando vídeo para o Supabase Storage...
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Formatos aceitos: MP4, WebM ou MOV. Tamanho máximo: 100 MB.
          </p>
        )}
      </div>

      {previewSrc ? (
        <div className="grid gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Preview local
          </p>
          <div className="relative aspect-[9/16] max-h-56 overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              src={previewSrc}
              controls
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="flex aspect-[9/16] max-h-40 items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-950/50 text-slate-500">
          <div className="flex flex-col items-center gap-2 text-sm">
            <Video className="h-6 w-6" />
            <span>Nenhum vídeo selecionado</span>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Ou colar URL do Supabase Storage
        </p>
        <Input
          value={value}
          onChange={handleManualUrlChange}
          placeholder="https://seu-projeto.supabase.co/storage/v1/object/public/reels/video.mp4"
          disabled={isUploading}
        />
      </div>

      {value ? (
        <Button
          type="button"
          variant="secondary"
          className="h-9 w-fit px-3 text-xs"
          disabled={isUploading}
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }

            if (localPreviewUrl) {
              URL.revokeObjectURL(localPreviewUrl);
              setLocalPreviewUrl(null);
            }

            onChange("");
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Limpar vídeo
        </Button>
      ) : null}

      {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
      {uploadError ? <p className="text-xs text-red-300">{uploadError}</p> : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
