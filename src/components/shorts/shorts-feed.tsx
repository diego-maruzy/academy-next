"use client";

import { Clapperboard } from "lucide-react";
import { ShortVideoCard } from "@/components/shorts/short-video-card";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type ShortsFeedProps = {
  shorts: AcademyShort[];
  className?: string;
};

export function ShortsFeed({ shorts, className }: ShortsFeedProps) {
  if (shorts.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[50vh] flex-col items-center justify-center rounded-[28px]",
          "border border-white/10 bg-white/[0.03] px-6 py-16 text-center",
          className,
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-300">
          <Clapperboard className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-white sm:text-2xl">
          Nenhum reel publicado ainda.
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Novos vídeos verticais aparecerão aqui assim que forem publicados.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile / tablet: um reel por viewport */}
      <div
        className={cn(
          "h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth",
          "snap-y snap-proximity",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "lg:hidden",
          className,
        )}
      >
        {shorts.map((short) => (
          <section
            key={short.id}
            data-analytics-event="short_view"
            data-short-id={short.id}
            className="flex h-full w-full shrink-0 snap-start items-center justify-center px-4"
          >
            <ShortVideoCard short={short} />
          </section>
        ))}
      </div>

      {/* Desktop: lista vertical */}
      <div
        className={cn(
          "mx-auto hidden w-full max-w-[1120px] flex-col gap-12 lg:flex",
          className,
        )}
      >
        {shorts.map((short) => (
          <section
            key={short.id}
            data-analytics-event="short_view"
            data-short-id={short.id}
            className="py-2"
          >
            <ShortVideoCard short={short} />
          </section>
        ))}
      </div>
    </>
  );
}
