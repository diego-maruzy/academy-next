"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  getReelsEmbedUrl,
  isDirectVideoUrl,
  postEmbedMute,
  postEmbedPause,
  postEmbedPlay,
} from "@/lib/video-embed";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type ReelPlayerProps = {
  reel: AcademyShort;
  isActive: boolean;
  isMuted: boolean;
  isPaused: boolean;
  onError: () => void;
  className?: string;
};

export function ReelPlayer({
  reel,
  isActive,
  isMuted,
  isPaused,
  onError,
  className,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const playback = useMemo(() => {
    if (isDirectVideoUrl(reel.video_url)) {
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

    video.muted = isMuted;

    if (!isActive || isPaused) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    playPromise.catch(() => {
      onError();
    });
  }, [isActive, isMuted, isPaused, onError, playback.type]);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (playback.type !== "embed" || !iframe) {
      return;
    }

    if (!isActive) {
      postEmbedPause(iframe, playback.provider);
      return;
    }

    postEmbedMute(iframe, playback.provider, isMuted);

    if (isPaused) {
      postEmbedPause(iframe, playback.provider);
      return;
    }

    postEmbedPlay(iframe, playback.provider);
  }, [isActive, isMuted, isPaused, playback]);

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
        muted={isMuted}
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
