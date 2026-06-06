import { ImageIcon, Video } from "lucide-react";
import { resolveLessonMediaType, type LessonMediaType } from "@/lib/lesson-media";
import { cn } from "@/lib/utils";
import { getVimeoEmbedUrl } from "@/lib/vimeo";

type ModulePlayerProps = {
  title: string;
  mediaType?: LessonMediaType | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  duration?: string;
  /** @deprecated Use imageUrl — mantido para compatibilidade */
  coverUrl?: string | null;
};

export function ModulePlayer({
  title,
  mediaType,
  videoUrl,
  imageUrl,
  coverUrl,
}: ModulePlayerProps) {
  const resolvedMediaType = mediaType
    ?? resolveLessonMediaType({
      vimeo_url: videoUrl,
      image_url: imageUrl ?? coverUrl,
    });

  const displayImageUrl = imageUrl ?? coverUrl ?? null;

  if (resolvedMediaType === "image") {
    return (
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#0B1220] shadow-2xl shadow-black/30 md:rounded-2xl">
        <div className="relative aspect-video w-full max-w-full">
          {displayImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImageUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,#111827,#020617)] px-6 text-center">
              <p className="text-sm text-slate-400">Imagem indisponível</p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />

          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/75 px-2.5 py-1 text-[11px] font-semibold text-slate-200 backdrop-blur">
            <ImageIcon className="h-3.5 w-3.5" />
            Imagem
          </span>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <p className="line-clamp-2 text-base font-semibold text-white sm:text-lg">
              {title}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = getVimeoEmbedUrl(videoUrl ?? null);

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl shadow-black/30 md:rounded-2xl">
      <div className="relative aspect-video w-full max-w-full">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full max-w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center px-6 text-center",
              "bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,#111827,#020617)]",
            )}
          >
            <div className="flex max-w-md flex-col items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300">
                <Video className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-white">Vídeo indisponível</p>
              <p className="text-sm text-slate-400">
                Esta aula está configurada como vídeo, mas o link do Vimeo não está
                disponível no momento.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
