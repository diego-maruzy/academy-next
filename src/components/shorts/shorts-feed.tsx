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
          Nenhum short publicado ainda.
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Novos vídeos verticais aparecerão aqui assim que forem publicados.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "snap-y snap-mandatory overflow-y-auto overflow-x-hidden overscroll-y-contain",
        "h-[calc(100dvh-3.5rem-4.75rem-env(safe-area-inset-bottom))]",
        "md:h-[calc(100dvh-4.5rem)]",
        "lg:h-auto lg:max-h-none lg:snap-none lg:overflow-visible",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <div className="mx-auto grid w-full max-w-[1120px] lg:gap-12">
        {shorts.map((short) => (
          <section
            key={short.id}
            data-analytics-event="short_view"
            data-short-id={short.id}
            className={cn(
              "snap-start snap-always px-4 py-4",
              "min-h-[calc(100dvh-3.5rem-4.75rem-env(safe-area-inset-bottom))]",
              "md:min-h-[calc(100dvh-4.5rem)] md:px-5",
              "lg:min-h-0 lg:px-0 lg:py-6",
            )}
          >
            <ShortVideoCard short={short} />
          </section>
        ))}
      </div>
    </div>
  );
}
