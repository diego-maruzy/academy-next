"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, PlayCircle } from "lucide-react";
import type { Module } from "@/types/academy";
import { cn } from "@/lib/utils";

export type ModuleCoverCardData = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl?: string;
  progress: number;
  badge: string;
  href: string;
  duration?: string;
};

type AcademyModuleCoverCardProps = {
  programSlug: string;
  module: Module;
  programName: string;
  isPremium?: boolean;
  progress?: number;
  className?: string;
};

type LegacyModuleCoverCardProps = ModuleCoverCardData & {
  className?: string;
};

type ModuleCoverCardProps =
  | AcademyModuleCoverCardProps
  | LegacyModuleCoverCardProps;

export function ModuleCoverCard(props: ModuleCoverCardProps) {
  const isAcademyCard = "module" in props;
  const title = isAcademyCard ? props.module.name : props.title;
  const subtitle = isAcademyCard
    ? props.programName
    : "subtitle" in props
      ? props.subtitle
      : "";
  const coverUrl = isAcademyCard ? props.module.cover_image_url : props.coverUrl;
  const progress = isAcademyCard ? props.progress ?? 0 : props.progress;
  const href = isAcademyCard
    ? `/programas/${props.programSlug}/modulos/${props.module.slug}`
    : props.href;
  const className = props.className;
  const [imageLoaded, setImageLoaded] = useState(Boolean(coverUrl));

  return (
    <Link
      href={href}
      className={cn(
        "group relative block aspect-[3/4] w-[78vw] max-w-[320px] shrink-0",
        "min-w-[260px] snap-start overflow-hidden rounded-2xl",
        "border border-white/10 bg-slate-900 shadow-2xl shadow-black/30",
        "transition duration-300 active:scale-[0.98]",
        "hover:-translate-y-1 hover:border-blue-400/60",
        "sm:min-w-[280px] md:min-w-[300px] md:w-[300px]",
        "lg:w-[23%] lg:min-w-[245px] xl:min-w-[280px]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(59,130,246,0.45),transparent_32%),linear-gradient(135deg,#0f172a,#020617_60%,#0f172a)]" />

      {coverUrl && imageLoaded ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={() => setImageLoaded(false)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-blue-300">
            <BookOpen className="h-8 w-8" />
          </div>
          <p className="line-clamp-3 text-sm font-medium">{title}</p>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/10 to-slate-950/85" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 md:p-4">
        <div className="rounded-full border border-white/10 bg-slate-950/55 p-2 text-blue-200 backdrop-blur">
          <PlayCircle className="h-4 w-4" />
        </div>
        <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          {progress}%
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
        <p className="line-clamp-2 text-base font-bold leading-snug text-white">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 line-clamp-1 text-xs text-slate-300">{subtitle}</p>
        ) : null}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-blue-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
