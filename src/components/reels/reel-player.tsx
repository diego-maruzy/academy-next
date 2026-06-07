"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  getReelsEmbedUrl,
  postEmbedMute,
  postEmbedPause,
  postEmbedPlay,
  usesNativeVideoPlayer,
} from "@/lib/video-embed";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type ReelPlayerProps = {
  reel: AcademyShort;
  isActive: boolean;
  globalMuted: boolean;
  isPaused: boolean;
  onError: () => void;
  className?: string;
};

export function ReelPlayer({
  reel,
  isActive,
  globalMuted,
  isPaused,
  onError,
  className,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const playback = useMemo(() => {
    if (usesNativeVideoPlayer(reel.video_url, reel.video_provider)) {
      return {
        type: "direct" as const,
        src: reel.video_url,
      };
    }

    const embedUrl = getReelsEmbedUrl(reel.video_url, reel.video_provider);

    if (!embedUrl) {
      return { type: "error" as const };
    }

    return {
      type: "embed" as const,
      src: embedUrl,
      provider: reel.video_provider,
    };
  }, [reel.video_provider, reel.video_url]);

  useEffect(() => {
    const video = videoRef.current;

    if (playback.type !== "direct" || !video) {
      return;
    }

    if (!isActive || isPaused) {
      video.pause();
      return;
    }

    video.play().catch((error) => {
      console.warn("[reel-player] Autoplay bloqueado:", error);
    });
  }, [isActive, isPaused, playback.type]);

  useEffect(() => {
    const video = videoRef.current;

    if (playback.type !== "direct" || !video) {
      return;
    }

    video.muted = globalMuted;
  }, [globalMuted, playback.type]);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (playback.type !== "embed" || !iframe) {
      return;
    }

    if (!isActive || isPaused) {
      postEmbedPause(iframe, playback.provider);
      return;
    }

    postEmbedPlay(iframe, playback.provider);
  }, [isActive, isPaused, playback]);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (playback.type !== "embed" || !iframe || !isActive) {
      return;
    }

    postEmbedMute(iframe, playback.provider, globalMuted);
  }, [globalMuted, isActive, playback]);

  useEffect(() => {
    if (playback.type === "error") {
      onError();
    }
  }, [onError, playback.type]);

  if (playback.type === "error") {
    return null;
  }

  if (playback.type === "direct") {
    return (
      <video
        ref={videoRef}
        src={playback.src}
        playsInline
        loop
        preload="metadata"
        onError={onError}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
      />
    );
  }

  if (!isActive) {
    if (reel.thumbnail_url) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={reel.thumbnail_url}
          alt=""
          className={cn("absolute inset-0 h-full w-full object-cover", className)}
        />
      );
    }

    return <div className={cn("absolute inset-0 bg-black", className)} />;
  }

  return (
    <iframe
      ref={iframeRef}
      src={playback.src}
      title={reel.title}
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      className={cn("absolute inset-0 h-full w-full border-0", className)}
    />
  );
}
