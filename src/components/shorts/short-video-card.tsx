"use client";

import { Play } from "lucide-react";
import { getVideoEmbedUrl } from "@/lib/video-embed";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type ShortVideoCardProps = {
  short: AcademyShort;
  className?: string;
};

export function ShortVideoCard({ short, className }: ShortVideoCardProps) {
  const embedUrl = getVideoEmbedUrl(short.video_url, short.video_provider);

  return (
    <article
      data-short-id={short.id}
      data-short-slug={short.slug}
      className={cn(
        "relative h-full w-full",
        "lg:grid lg:h-auto lg:max-w-[1120px] lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-center lg:gap-10",
        className,
      )}
    >
      {/* Mobile: vídeo + faixa de título separada */}
      <div className="flex h-full w-full flex-col gap-2 bg-[#050814] lg:hidden">
        <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={short.title}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              allowFullScreen
            />
          ) : short.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={short.thumbnail_url}
              alt={short.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_38%),linear-gradient(160deg,#111827,#020617)] px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sky-300">
                <Play className="h-6 w-6 fill-current" />
              </span>
              <p className="text-sm font-medium text-slate-300">
                Vídeo indisponível
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 pb-1 pt-0.5">
          <h2 className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-300">
            {short.title}
          </h2>
        </div>
      </div>

      {/* Desktop: player + painel lateral */}
      <div
        className={cn(
          "relative hidden overflow-hidden rounded-[28px]",
          "border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
          "aspect-[9/16] w-full max-w-[400px] lg:block",
        )}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={short.title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
            allowFullScreen
          />
        ) : short.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={short.thumbnail_url}
            alt={short.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_38%),linear-gradient(160deg,#111827,#020617)] px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sky-300">
              <Play className="h-6 w-6 fill-current" />
            </span>
            <p className="text-sm font-medium text-slate-300">
              Vídeo indisponível
            </p>
          </div>
        )}
      </div>

      <div className="hidden min-w-0 flex-col gap-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:flex">
        {short.category || short.duration_label ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {[short.category, short.duration_label].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold leading-snug text-white">
          {short.title}
        </h2>
        {short.description ? (
          <p className="text-sm leading-relaxed text-slate-400">
            {short.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
