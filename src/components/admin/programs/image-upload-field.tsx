"use client";

import { ImageIcon, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import {
  uploadImageToSupabaseStorage,
  type ImageFolder,
} from "@/lib/storage/upload-image";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  label: string;
  currentImageUrl?: string | null;
  onChange: (url: string | undefined) => void;
  folder: ImageFolder;
  helperText?: string;
  error?: string;
};

function ImagePreview({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {caption}
      </p>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-40 w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>
    </div>
  );
}

export function ImageUploadField({
  label,
  currentImageUrl,
  onChange,
  folder,
  helperText,
  error,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [manualUrlTouched, setManualUrlTouched] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  function clearNewSelection() {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setLocalPreviewUrl(null);
    setUploadedUrl(null);
    setManualUrl("");
    setManualUrlTouched(false);
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onChange(undefined);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError(null);
    setManualUrl("");
    setManualUrlTouched(false);

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(previewUrl);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadImageToSupabaseStorage(formData, folder);

    setIsUploading(false);

    if (!result.success || !result.publicUrl) {
      setUploadError(result.error ?? "Não foi possível enviar a imagem.");
      setUploadedUrl(null);
      onChange(undefined);
      return;
    }

    setUploadedUrl(result.publicUrl);
    onChange(result.publicUrl);
  }

  function handleManualUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setManualUrl(value);
    setManualUrlTouched(true);
    setUploadError(null);

    if (uploadedUrl || localPreviewUrl) {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }

      setLocalPreviewUrl(null);
      setUploadedUrl(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

    const trimmed = value.trim();
    onChange(trimmed.length > 0 ? trimmed : undefined);
  }

  const newImagePreview = uploadedUrl ?? localPreviewUrl;
  const hasNewSelection = Boolean(uploadedUrl || localPreviewUrl || manualUrlTouched);

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <Field label={label}>
        <div className="grid gap-4">
          {currentImageUrl ? (
            <ImagePreview
              src={currentImageUrl}
              alt="Imagem atual"
              caption="Imagem atual"
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-950/50 text-slate-500">
              <div className="flex flex-col items-center gap-2 text-sm">
                <ImageIcon className="h-6 w-6" />
                <span>Nenhuma imagem cadastrada</span>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Enviar nova imagem
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
                Enviando imagem...
              </p>
            ) : null}
          </div>

          {newImagePreview ? (
            <div className="grid gap-3">
              <ImagePreview
                src={newImagePreview}
                alt="Nova imagem selecionada"
                caption="Nova imagem selecionada"
              />
              <Button
                type="button"
                variant="secondary"
                className="h-9 w-fit px-3 text-xs"
                onClick={clearNewSelection}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
                Remover nova imagem selecionada
              </Button>
            </div>
          ) : null}

          <div className="grid gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Ou usar URL manual
            </p>
            <Input
              value={manualUrl}
              onChange={handleManualUrlChange}
              placeholder="https://..."
              disabled={isUploading}
            />
          </div>

          <p className="text-xs text-slate-400">
            Se nenhuma nova imagem for enviada, a imagem atual será mantida.
          </p>

          {helperText ? (
            <p className="text-xs text-slate-500">{helperText}</p>
          ) : null}

          {uploadError ? (
            <p className="text-xs text-red-300">{uploadError}</p>
          ) : null}

          {error ? <p className="text-xs text-red-300">{error}</p> : null}

          {hasNewSelection && !uploadError ? (
            <p className="text-xs text-emerald-300/90">
              Nova imagem pronta para salvar.
            </p>
          ) : null}
        </div>
      </Field>
    </div>
  );
}
