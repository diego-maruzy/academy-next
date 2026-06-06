import { Clapperboard, Eye, Sparkles, Video } from "lucide-react";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type AdminShortsStatsProps = {
  shorts: AcademyShort[];
};

const items = [
  { key: "total", label: "Total de shorts", icon: Video, accent: "text-blue-300" },
  { key: "published", label: "Publicados", icon: Eye, accent: "text-emerald-300" },
  { key: "featured", label: "Destaques", icon: Sparkles, accent: "text-violet-300" },
  { key: "draft", label: "Rascunhos", icon: Clapperboard, accent: "text-amber-300" },
] as const;

function getValue(key: (typeof items)[number]["key"], shorts: AcademyShort[]) {
  if (key === "total") return shorts.length;
  if (key === "published") return shorts.filter((s) => s.published).length;
  if (key === "featured") return shorts.filter((s) => s.featured).length;
  return shorts.filter((s) => !s.published).length;
}

export function AdminShortsStats({ shorts }: AdminShortsStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="rounded-2xl border border-white/10 bg-[#0B1220]/90 p-4 transition hover:border-white/15 hover:bg-white/[0.04] sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className={cn("mt-2 text-3xl font-bold", item.accent)}>
                  {getValue(item.key, shorts)}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300">
                <Icon className="h-4 w-4" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
