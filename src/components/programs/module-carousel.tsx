"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ModuleCoverCard,
  type ModuleCoverCardData,
} from "@/components/programs/module-cover-card";
import type { ModuleProgressMap } from "@/lib/progress-data";
import type { Module } from "@/types/academy";

type ModuleCarouselProps = {
  title: string;
  subtitle?: string;
  progressLabel?: string;
  progressPercent?: number;
  modules?: ModuleCoverCardData[];
  academyModules?: Module[];
  programSlug?: string;
  programName?: string;
  isPremium?: boolean;
  moduleProgressMap?: ModuleProgressMap;
};

export function ModuleCarousel({
  title,
  subtitle,
  progressLabel,
  progressPercent = 0,
  modules = [],
  academyModules,
  programSlug,
  programName,
  isPremium,
  moduleProgressMap = {},
}: ModuleCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    element.scrollBy({
      left:
        direction === "left"
          ? -element.clientWidth * 0.85
          : element.clientWidth * 0.85,
      behavior: "smooth",
    });
  }

  return (
    <section className="grid min-w-0 gap-3 md:gap-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-bold tracking-tight text-white md:text-2xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate-400">
              {subtitle}
            </p>
          ) : null}

          {progressLabel ? (
            <div className="mt-3 flex max-w-full items-center gap-3 sm:hidden">
              <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-medium text-slate-400">
                {progressLabel}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {progressLabel ? (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10 md:w-28">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-400">
                {progressLabel}
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition active:scale-[0.98] hover:bg-white/10 hover:text-white"
              aria-label="Voltar carrossel"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition active:scale-[0.98] hover:bg-white/10 hover:text-white"
              aria-label="Avançar carrossel"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] md:-mx-5 md:gap-4 md:px-5 md:pb-3 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {academyModules && programSlug && programName
          ? academyModules.map((module) => (
              <ModuleCoverCard
                key={module.id}
                programSlug={programSlug}
                programName={programName}
                module={module}
                isPremium={isPremium}
                progress={moduleProgressMap[module.id]?.percentage ?? 0}
                className="snap-start"
              />
            ))
          : modules.map((module) => (
              <ModuleCoverCard key={module.id} {...module} className="snap-start" />
            ))}
      </div>
    </section>
  );
}
