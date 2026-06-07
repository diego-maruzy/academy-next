"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ReelPlayer } from "@/components/reels/reel-player";
import { REELS_CONTENT_BOTTOM } from "@/components/reels/reels-layout";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type ReelSlideProps = {
  reel: AcademyShort;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
};

export function ReelSlide({
  reel,
  isActive,
  isMuted,
  onToggleMute,
}: ReelSlideProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [hasError, setHasError] = useState(false);

  const togglePause = useCallback(() => {
    setIsPaused((current) => !current);
  }, []);

  const handleShare = useCallback(async () => {
    const shareUrl = reel.cta_url ?? window.location.href;
    const shareData = {
      title: reel.title,
      text: reel.description ?? reel.title,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // usuário cancelou
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert("Link copiado.");
    } catch {
      window.alert("Não foi possível compartilhar.");
    }
  }, [reel.cta_url, reel.description, reel.title]);

  return (
    <section
      className="relative h-[100dvh] w-full snap-start snap-always shrink-0 overflow-hidden bg-black"
      data-reel-id={reel.id}
      aria-label={reel.title}
    >
      <button
        type="button"
        className="absolute inset-0 z-10"
        aria-label={isPaused ? "Reproduzir vídeo" : "Pausar vídeo"}
        onClick={togglePause}
      />

      {hasError ? (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black px-6 text-center">
          <p className="text-sm text-slate-400">
            Não foi possível carregar este vídeo.
          </p>
        </div>
      ) : (
        <ReelPlayer
          reel={reel}
          isActive={isActive}
          isMuted={isMuted}
          isPaused={isPaused}
          onError={() => setHasError(true)}
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
        style={{ paddingBottom: REELS_CONTENT_BOTTOM }}
      >
        <div className="pointer-events-auto px-4 pr-20">
          {reel.category ? (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
              {reel.category}
            </p>
          ) : null}
          <h2 className="text-base font-semibold leading-snug text-white">
            {reel.title}
          </h2>
          {reel.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-300/90">
              {reel.description}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="absolute right-4 z-30 flex flex-col items-center gap-4"
        style={{ bottom: REELS_CONTENT_BOTTOM }}
      >
        <ActionButton
          label={isPaused ? "Reproduzir" : "Pausar"}
          onClick={togglePause}
        >
          {isPaused ? (
            <Play className="h-5 w-5 fill-current" />
          ) : (
            <Pause className="h-5 w-5 fill-current" />
          )}
        </ActionButton>

        <ActionButton
          label={isMuted ? "Ativar som" : "Silenciar"}
          onClick={onToggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </ActionButton>

        <ActionButton label="Compartilhar" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
        </ActionButton>
      </div>

      {isPaused ? (
        <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
            <Play className="h-7 w-7 fill-current" />
          </span>
        </div>
      ) : null}
    </section>
  );
}

function ActionButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full",
        "border border-white/15 bg-black/35 text-white backdrop-blur-md",
        "transition active:scale-95 hover:bg-black/50",
      )}
    >
      {children}
    </button>
  );
}
