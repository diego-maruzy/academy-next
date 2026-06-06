import { ShortsFeed } from "@/components/shorts/shorts-feed";
import { getPublishedShorts } from "@/lib/shorts-data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ShortsPage() {
  const shorts = await getPublishedShorts();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        "h-[calc(100dvh-7rem-env(safe-area-inset-bottom))]",
        "sm:h-[calc(100dvh-7rem-env(safe-area-inset-bottom)-3.25rem)]",
        "max-lg:overflow-hidden max-lg:pt-0",
        "lg:h-auto lg:gap-6 lg:overflow-visible lg:pt-0",
      )}
    >
      <header className="hidden shrink-0 min-w-0 sm:block lg:max-w-[1120px]">
        <p className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 lg:block">
          Academy
        </p>
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:mt-2 lg:text-[2rem]">
          Academy Shorts
        </h1>
        <p className="mt-2 hidden max-w-2xl text-sm text-slate-400 sm:block lg:text-base">
          Vídeos rápidos para acelerar sua visão de mercado.
        </p>
      </header>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          "-mx-4 min-w-0 md:-mx-5",
          "pb-3",
          "sm:mt-3",
          "lg:mx-auto lg:w-full lg:flex-none lg:overflow-visible lg:pb-0 lg:mt-0",
        )}
      >
        <ShortsFeed shorts={shorts} className="h-full" />
      </div>
    </div>
  );
}
