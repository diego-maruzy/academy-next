"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Lock, PlayCircle } from "lucide-react";
import { getProgramUpgradeUrl } from "@/lib/student-access";
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
  locked?: boolean;
  upgradeUrl?: string | null;
  isPremium?: boolean;
};

type AcademyModuleCoverCardProps = {
  programSlug: string;
  module: Module;
  programName: string;
  isPremium?: boolean;
  progress?: number;
  locked?: boolean;
  upgradeUrl?: string | null;
  className?: string;
};

type LegacyModuleCoverCardProps = ModuleCoverCardData & {
  className?: string;
};

type ModuleCoverCardProps =
  | AcademyModuleCoverCardProps
  | LegacyModuleCoverCardProps;

const cardClassName = cn(
  "group relative block aspect-[3/4] w-[78vw] max-w-[320px] shrink-0",
  "min-w-[260px] snap-start overflow-hidden rounded-2xl",
  "border border-white/10 bg-slate-900 shadow-2xl shadow-black/30",
  "transition duration-300",
  "sm:min-w-[280px] md:min-w-[300px] md:w-[300px]",
  "lg:w-[23%] lg:min-w-[245px] xl:min-w-[280px]",
);

function CardVisual({
  title,
  coverUrl,
  progress,
  locked,
  isPremium,
  upgradeHref,
}: {
  title: string;
  coverUrl?: string | null;
  progress: number;
  locked: boolean;
  isPremium?: boolean;
  upgradeHref: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(Boolean(coverUrl));
  const displayProgress = locked ? 0 : progress;
  const isExternalUpgrade = upgradeHref.startsWith("http");

  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(59,130,246,0.45),transparent_32%),linear-gradient(135deg,#0f172a,#020617_60%,#0f172a)]" />

      {coverUrl && imageLoaded ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition duration-500",
            !locked && "group-hover:scale-105",
            locked && "brightness-75",
          )}
          onError={() => setImageLoaded(false)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-blue-300">
            <BookOpen className="h-8 w-8" />
          </div>
        </div>
      )}

      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/10 to-slate-950/85",
          locked && "from-black/50 via-black/40 to-black/75",
        )}
      />

      {locked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 px-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/80 text-amber-200 backdrop-blur">
            <Lock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-white">Conteúdo premium</p>
          <a
            href={upgradeHref}
            target={isExternalUpgrade ? "_blank" : undefined}
            rel={isExternalUpgrade ? "noreferrer" : undefined}
            onClick={(event) => event.stopPropagation()}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            Upgrade
          </a>
        </div>
      ) : null}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 md:p-4">
        {!locked ? (
          <div className="rounded-full border border-white/10 bg-slate-950/55 p-2 text-blue-200 backdrop-blur">
            <PlayCircle className="h-4 w-4" />
          </div>
        ) : (
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200 backdrop-blur">
            Premium
          </span>
        )}
        <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          {displayProgress}%
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
        {isPremium && !locked ? (
          <span className="mb-3 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
            Premium
          </span>
        ) : null}
        <div className="h-1 overflow-hidden rounded-full bg-white/15">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              locked ? "bg-slate-500" : "bg-blue-400",
            )}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>
    </>
  );
}

export function ModuleCoverCard(props: ModuleCoverCardProps) {
  const isAcademyCard = "module" in props;
  const title = isAcademyCard ? props.module.name : props.title;
  const coverUrl = isAcademyCard ? props.module.cover_image_url : props.coverUrl;
  const progress = isAcademyCard ? props.progress ?? 0 : props.progress;
  const href = isAcademyCard
    ? `/programas/${props.programSlug}/modulos/${props.module.slug}`
    : props.href;
  const locked = isAcademyCard ? Boolean(props.locked) : Boolean(props.locked);
  const isPremium = isAcademyCard ? props.isPremium : props.isPremium;
  const upgradeUrl = isAcademyCard ? props.upgradeUrl : props.upgradeUrl;
  const className = props.className;
  const upgradeHref = getProgramUpgradeUrl(upgradeUrl);

  if (locked) {
    return (
      <article
        className={cn(cardClassName, "cursor-default", className)}
        aria-label={`${title} — conteúdo premium bloqueado`}
      >
        <CardVisual
          title={title}
          coverUrl={coverUrl}
          progress={progress}
          locked
          isPremium={isPremium}
          upgradeHref={upgradeHref}
        />
      </article>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        cardClassName,
        "active:scale-[0.98] hover:-translate-y-1 hover:border-blue-400/60",
        className,
      )}
    >
      <CardVisual
        title={title}
        coverUrl={coverUrl}
        progress={progress}
        locked={false}
        isPremium={isPremium}
        upgradeHref={upgradeHref}
      />
    </Link>
  );
}
