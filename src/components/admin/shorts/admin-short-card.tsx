import { Eye, Pencil, PlaySquare } from "lucide-react";
import { DeleteShortButton } from "@/components/admin/shorts/delete-short-button";
import { ButtonLink } from "@/components/ui/button";
import { getVideoEmbedUrl } from "@/lib/video-embed";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type AdminShortCardProps = {
  short: AcademyShort;
};

function ProviderBadge({ provider }: { provider: AcademyShort["video_provider"] }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        provider === "youtube"
          ? "border-red-400/20 bg-red-400/10 text-red-300"
          : "border-sky-400/20 bg-sky-400/10 text-sky-300",
      )}
    >
      {provider === "youtube" ? "YouTube" : "Vimeo"}
    </span>
  );
}

export function AdminShortCard({ short }: AdminShortCardProps) {
  const embedUrl = getVideoEmbedUrl(short.video_url, short.video_provider);

  return (
    <article
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0B1220]/90 p-4 transition sm:p-5",
        "hover:border-blue-400/30 hover:bg-white/[0.04]",
        "lg:flex lg:items-center lg:justify-between lg:gap-6",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="relative h-[120px] w-[68px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black sm:h-[140px] sm:w-[78px]">
          {short.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={short.thumbnail_url}
              alt={short.title}
              className="h-full w-full object-cover"
            />
          ) : embedUrl ? (
            <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sky-300">
              <PlaySquare className="h-6 w-6" />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-500">
              <PlaySquare className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-semibold text-white sm:text-lg">
            {short.title}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-500">{short.slug}</p>
          {short.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">
              {short.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 lg:mt-0">
        <ProviderBadge provider={short.video_provider} />
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-semibold",
            short.published
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-amber-400/20 bg-amber-400/10 text-amber-200",
          )}
        >
          {short.published ? "Publicado" : "Rascunho"}
        </span>
        {short.featured ? (
          <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-xs font-semibold text-violet-200">
            Destaque
          </span>
        ) : null}
        {short.category ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
            {short.category}
          </span>
        ) : null}
        {short.duration_label ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
            {short.duration_label}
          </span>
        ) : null}
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
          Ordem {short.display_order}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:mt-0 lg:w-auto lg:min-w-[280px] lg:shrink-0">
        {short.published ? (
          <ButtonLink
            href="/reels"
            variant="secondary"
            className="min-h-[44px] w-full"
            target="_blank"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </ButtonLink>
        ) : (
          <span className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-600">
            <Eye className="mr-2 h-4 w-4" />
            Rascunho
          </span>
        )}
        <ButtonLink
          href={`/admin/shorts/${short.id}/editar`}
          variant="secondary"
          className="min-h-[44px] w-full"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </ButtonLink>
        <DeleteShortButton id={short.id} className="min-h-[44px] w-full" />
      </div>
    </article>
  );
}
