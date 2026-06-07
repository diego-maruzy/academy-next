"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clapperboard } from "lucide-react";
import { ReelSlide } from "@/components/reels/reel-slide";
import { REELS_SCROLL_CLASS } from "@/components/reels/reels-layout";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type ReelsFeedProps = {
  reels: AcademyShort[];
  className?: string;
};

export function ReelsFeed({ reels, className }: ReelsFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || reels.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const index = Number(
            (entry.target as HTMLElement).dataset.reelIndex ?? -1,
          );

          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }

        if (bestIndex >= 0) {
          setActiveIndex(bestIndex);
        }
      },
      {
        root: container,
        threshold: [0.35, 0.5, 0.65, 0.85],
      },
    );

    for (const slide of slideRefs.current) {
      if (slide) {
        observer.observe(slide);
      }
    }

    return () => observer.disconnect();
  }, [reels.length]);

  const toggleMute = useCallback(() => {
    setIsMuted((current) => !current);
  }, []);

  if (reels.length === 0) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-black px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300">
          <Clapperboard className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-white">
          Nenhum reel disponível
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Volte em breve para assistir novos vídeos.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(REELS_SCROLL_CLASS, className)}
    >
      {reels.map((reel, index) => (
        <div
          key={reel.id}
          ref={(element) => {
            slideRefs.current[index] = element;
          }}
          data-reel-index={index}
          className="h-[100dvh] w-full shrink-0 snap-start snap-always"
        >
          <ReelSlide
            reel={reel}
            isActive={index === activeIndex}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        </div>
      ))}
    </div>
  );
}
