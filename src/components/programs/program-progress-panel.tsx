import Link from "next/link";
import { PlayCircle } from "lucide-react";
import type { ModuleProgressMap } from "@/lib/progress-data";
import type { Module, Program } from "@/types/academy";
import { cn } from "@/lib/utils";

type ProgramProgressPanelProps = {
  program: Program;
  modules: Module[];
  currentModuleSlug: string;
  moduleProgressMap: ModuleProgressMap;
};

export function ProgramProgressPanel({
  program,
  modules,
  currentModuleSlug,
  moduleProgressMap,
}: ProgramProgressPanelProps) {
  return (
    <aside
      className={cn(
        "w-full min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20",
        "md:p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
        Programa
      </p>
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
        <h2 className="line-clamp-2 text-lg font-semibold text-white md:text-xl">
          {program.name}
        </h2>
        {program.is_premium ? (
          <span className="shrink-0 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-bold text-slate-950">
            Premium
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Continue avançando pelos módulos disponíveis.
      </p>

      <div className="mt-5 grid max-h-[50vh] gap-2.5 overflow-y-auto pr-1 md:mt-6 md:max-h-none md:gap-3 lg:max-h-[calc(100vh-14rem)]">
        {modules.map((module, index) => {
          const active = module.slug === currentModuleSlug;
          const progress = moduleProgressMap[module.id] ?? {
            totalLessons: 0,
            completedLessons: 0,
            percentage: 0,
          };
          const done = progress.percentage === 100;

          return (
            <Link
              key={module.id}
              href={`/programas/${program.slug}/modulos/${module.slug}`}
              className={cn(
                "block min-h-[44px] rounded-2xl border border-white/10 bg-slate-950/60 p-3 transition active:scale-[0.99] hover:bg-white/10 md:p-4",
                active && "border-blue-400/30 bg-blue-500/10",
                done && !active && "border-emerald-400/20",
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-slate-400",
                    active && "bg-blue-500 text-white",
                    done && !active && "bg-emerald-400/15 text-emerald-300",
                  )}
                >
                  {active ? <PlayCircle className="h-4 w-4" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-white">
                      {String(index + 1).padStart(2, "0")}. {module.name}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {progress.completedLessons}/{progress.totalLessons}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {module.description ?? "Módulo do programa"}
                  </p>
                  <div className="mt-2.5 h-1.5 w-full max-w-full overflow-hidden rounded-full bg-white/10 md:mt-3">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        done ? "bg-emerald-400" : "bg-blue-400",
                      )}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
