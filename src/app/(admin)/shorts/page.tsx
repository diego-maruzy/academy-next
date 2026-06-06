import { ShortsFeed } from "@/components/shorts/shorts-feed";
import { REELS_VIEWPORT_CLASS } from "@/components/shorts/reels-layout";
import { getPublishedShorts } from "@/lib/shorts-data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const shorts = await getPublishedShorts();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        REELS_VIEWPORT_CLASS,
        "max-lg:-mx-4 max-lg:-mt-4",
        "lg:h-auto lg:gap-6 lg:overflow-visible lg:mx-0 lg:mt-0",
      )}
    >
      <header className="hidden shrink-0 min-w-0 lg:block lg:max-w-[1120px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Academy
        </p>
        <h1 className="mt-2 text-[2rem] font-bold tracking-tight text-white">
          Reels
        </h1>
        <p className="mt-2 max-w-2xl text-base text-slate-400">
          Vídeos rápidos para acelerar sua visão de mercado.
        </p>
      </header>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          "lg:mx-auto lg:w-full lg:flex-none lg:overflow-visible",
        )}
      >
        <ShortsFeed shorts={shorts} className="h-full" />
      </div>
    </div>
  );
}
