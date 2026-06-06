import { ShortsFeed } from "@/components/shorts/shorts-feed";
import { getPublishedShorts } from "@/lib/shorts-data";

export const dynamic = "force-dynamic";

export default async function ShortsPage() {
  const shorts = await getPublishedShorts();

  return (
    <div className="grid min-w-0 gap-4 md:gap-5 lg:gap-6">
      <header className="min-w-0 px-0 lg:max-w-[1120px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Academy
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
          Academy Shorts
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400 lg:text-base">
          Vídeos rápidos para acelerar sua visão de mercado.
        </p>
      </header>

      <div className="-mx-4 min-w-0 md:-mx-5 lg:mx-auto lg:w-full">
        <ShortsFeed shorts={shorts} />
      </div>
    </div>
  );
}
