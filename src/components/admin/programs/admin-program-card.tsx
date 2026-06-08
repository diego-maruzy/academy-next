import type { ReactNode } from "react";
import Image from "next/image";
import {
  BookOpen,
  ExternalLink,
  Eye,
  Layers3,
  Pencil,
} from "lucide-react";
import { DeleteConfirmButton } from "@/components/admin/programs/delete-confirm-button";
import { ButtonLink } from "@/components/ui/button";
import type { ProgramWithModules } from "@/types/academy";
import { cn } from "@/lib/utils";

type AdminProgramCardProps = {
  program: ProgramWithModules;
  orderIndex?: number;
  isDragging?: boolean;
  dragHandle?: ReactNode;
};

function getProgramDisplayName(program: ProgramWithModules) {
  const name = program.name?.trim();
  return name || program.slug;
}

function ProgramStatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        published
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-amber-400/20 bg-amber-400/10 text-amber-200",
      )}
    >
      {published ? "Publicado" : "Rascunho"}
    </span>
  );
}

function ProgramPremiumBadge({ isPremium }: { isPremium: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        isPremium
          ? "border-violet-400/20 bg-violet-400/10 text-violet-200"
          : "border-white/10 bg-white/5 text-slate-400",
      )}
    >
      {isPremium ? "Premium" : "Gratuito"}
    </span>
  );
}

function ProgramUpgradeBadge({
  isPremium,
  upgradeUrl,
}: {
  isPremium: boolean;
  upgradeUrl: string | null;
}) {
  if (!isPremium) {
    return <span className="text-xs text-slate-600">—</span>;
  }

  if (upgradeUrl) {
    return (
      <a
        href={upgradeUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Configurado
      </a>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-500">
      Não configurado
    </span>
  );
}

function ProgramCover({ program }: { program: ProgramWithModules }) {
  if (program.cover_image_url) {
    const isRemote = program.cover_image_url.startsWith("http");

    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 sm:h-16 sm:w-16">
        {isRemote ? (
          <Image
            src={program.cover_image_url}
            alt={getProgramDisplayName(program)}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={program.cover_image_url}
            alt={getProgramDisplayName(program)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 sm:h-16 sm:w-16",
        "bg-[linear-gradient(135deg,rgba(83,188,118,0.25),rgba(57,175,242,0.25))] text-sky-200",
      )}
    >
      <BookOpen className="h-5 w-5" />
    </div>
  );
}

export function AdminProgramCard({
  program,
  orderIndex,
  isDragging = false,
  dragHandle,
}: AdminProgramCardProps) {
  const displayOrder =
    orderIndex !== undefined ? orderIndex + 1 : program.display_order + 1;

  const displayName = getProgramDisplayName(program);

  return (
    <article
      className={cn(
        "group grid gap-4 rounded-2xl border border-white/10 bg-[#0B1220]/90 p-4 transition sm:gap-5 sm:p-5",
        "hover:border-blue-400/30 hover:bg-white/[0.04]",
        "xl:grid-cols-[minmax(0,1fr)_auto]",
        isDragging && "border-blue-400/40 bg-white/[0.06] shadow-xl shadow-black/30",
      )}
    >
      <div className="grid min-w-0 gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {dragHandle}
          <ProgramCover program={program} />
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-base font-semibold leading-snug text-white sm:text-lg">
              {displayName}
            </h3>
            <p className="mt-1 break-all font-mono text-xs text-slate-500">
              {program.slug}
            </p>
            {program.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                {program.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ProgramStatusBadge published={program.published} />
          <ProgramPremiumBadge isPremium={program.is_premium} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Upgrade
            </span>
            <ProgramUpgradeBadge
              isPremium={program.is_premium}
              upgradeUrl={program.upgrade_url}
            />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
            <Layers3 className="h-3.5 w-3.5 text-sky-300" />
            {program.modules.length} módulos
          </div>
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
            Ordem {displayOrder}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-[280px] xl:self-center">
        <ButtonLink
          href={`/admin/programas/${program.id}`}
          variant="secondary"
          className="min-h-[44px] w-full"
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver
        </ButtonLink>
        <ButtonLink
          href={`/admin/programas/${program.id}/editar`}
          variant="secondary"
          className="min-h-[44px] w-full"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </ButtonLink>
        <DeleteConfirmButton
          type="program"
          id={program.id}
          label="Excluir"
          className="min-h-[44px] w-full"
        />
      </div>
    </article>
  );
}
