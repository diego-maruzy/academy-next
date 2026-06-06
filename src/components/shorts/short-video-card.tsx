"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Clapperboard,
  MoreHorizontal,
  Play,
  Share2,
  Volume2,
} from "lucide-react";
import { checkoutBrandGradientClass } from "@/components/checkout/checkout-theme";
import { getVideoEmbedUrl } from "@/lib/video-embed";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type ShortVideoCardProps = {
  short: AcademyShort;
  className?: string;
};

export function ShortVideoCard({ short, className }: ShortVideoCardProps) {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const embedUrl = getVideoEmbedUrl(short.video_url, short.video_provider);
  const hasCta = Boolean(short.cta_label && short.cta_url);

  async function handleShare() {
    const shareData = {
      title: short.title,
      text: short.description ?? undefined,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // usuário cancelou ou share indisponível
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback("Link copiado");
      window.setTimeout(() => setShareFeedback(null), 2200);
    } catch {
      setShareFeedback("Não foi possível copiar");
      window.setTimeout(() => setShareFeedback(null), 2200);
    }
  }

  return (
    <article
      data-short-id={short.id}
      data-short-slug={short.slug}
      className={cn(
        "flex w-full max-w-[1120px] flex-col items-center justify-center gap-2",
        "max-lg:max-h-full max-lg:min-h-0",
        "lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-center lg:gap-10",
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[28px]",
          "border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
          "aspect-[9/16] w-[min(88vw,340px)]",
          "max-lg:max-h-[min(62dvh,calc(100%-6.5rem))]",
          "lg:aspect-[9/16] lg:h-auto lg:w-full lg:max-h-none lg:max-w-[400px]",
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

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/25 lg:to-black/40" />

        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
          <div className="flex flex-wrap gap-2">
            {short.category ? (
              <span className="rounded-full border border-white/15 bg-slate-950/75 px-2.5 py-1 text-[11px] font-semibold text-sky-200 backdrop-blur">
                {short.category}
              </span>
            ) : null}
            {short.duration_label ? (
              <span className="rounded-full border border-white/15 bg-slate-950/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                {short.duration_label}
              </span>
            ) : null}
          </div>

          <div className="flex gap-2">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-200 backdrop-blur"
            >
              <Volume2 className="h-4 w-4" />
            </span>
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-200 backdrop-blur"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[min(88vw,340px)] shrink-0 space-y-1.5 px-1 pb-2 lg:hidden">
        <h2 className="line-clamp-1 text-sm font-bold text-white sm:line-clamp-2 sm:text-base">
          {short.title}
        </h2>
        {short.description ? (
          <p className="hidden line-clamp-1 text-sm text-slate-400 sm:block">
            {short.description}
          </p>
        ) : null}
        <div className="flex items-center gap-2 pt-0.5">
          {hasCta ? (
            <Link
              href={short.cta_url!}
              data-analytics-event="short_cta_click"
              className={cn(
                "inline-flex h-10 min-h-[44px] flex-1 items-center justify-center rounded-xl px-3 text-xs font-bold text-white transition sm:h-11 sm:px-4 sm:text-sm",
                checkoutBrandGradientClass,
                "shadow-lg shadow-sky-500/20 active:scale-[0.98]",
              )}
            >
              {short.cta_label}
            </Link>
          ) : (
            <span className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs text-slate-500 sm:h-11 sm:text-sm">
              Sem CTA configurado
            </span>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 sm:h-11 sm:w-11"
            aria-label="Compartilhar reel"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        {shareFeedback ? (
          <p className="text-center text-xs font-medium text-emerald-300">
            {shareFeedback}
          </p>
        ) : null}
      </div>

      <div className="hidden min-w-0 flex-col gap-5 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:flex">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-sky-200">
          <Clapperboard className="h-3.5 w-3.5" />
          Academy Reel
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {[short.category, short.duration_label].filter(Boolean).join(" · ") ||
              "Conteúdo rápido"}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{short.title}</h2>
          {short.description ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {short.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasCta ? (
            <Link
              href={short.cta_url!}
              data-analytics-event="short_cta_click"
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition",
                checkoutBrandGradientClass,
                "shadow-lg shadow-sky-500/20 hover:brightness-105 active:scale-[0.98]",
              )}
            >
              {short.cta_label}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <Share2 className="h-4 w-4" />
            {shareFeedback ?? "Compartilhar"}
          </button>
        </div>
      </div>
    </article>
  );
}
