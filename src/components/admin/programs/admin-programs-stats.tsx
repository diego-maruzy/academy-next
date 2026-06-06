import {
  BookOpen,
  Crown,
  Layers3,
  Rocket,
} from "lucide-react";
import type { ProgramWithModules } from "@/types/academy";
import { cn } from "@/lib/utils";

type AdminProgramsStatsProps = {
  programs: ProgramWithModules[];
  className?: string;
};

const statItems = [
  {
    key: "total",
    label: "Total de programas",
    icon: BookOpen,
    accent: "text-blue-300",
    iconBg: "bg-blue-500/10 text-blue-300",
  },
  {
    key: "published",
    label: "Publicados",
    icon: Rocket,
    accent: "text-emerald-300",
    iconBg: "bg-emerald-500/10 text-emerald-300",
  },
  {
    key: "premium",
    label: "Premium",
    icon: Crown,
    accent: "text-violet-300",
    iconBg: "bg-violet-500/10 text-violet-300",
  },
  {
    key: "modules",
    label: "Módulos cadastrados",
    icon: Layers3,
    accent: "text-sky-300",
    iconBg: "bg-sky-500/10 text-sky-300",
  },
] as const;

function getStatValue(
  key: (typeof statItems)[number]["key"],
  programs: ProgramWithModules[],
) {
  if (key === "total") {
    return programs.length;
  }

  if (key === "published") {
    return programs.filter((program) => program.published).length;
  }

  if (key === "premium") {
    return programs.filter((program) => program.is_premium).length;
  }

  return programs.reduce(
    (total, program) => total + program.modules.length,
    0,
  );
}

export function AdminProgramsStats({
  programs,
  className,
}: AdminProgramsStatsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4",
        className,
      )}
    >
      {statItems.map((item) => {
        const Icon = item.icon;
        const value = getStatValue(item.key, programs);

        return (
          <div
            key={item.key}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-white/10",
              "bg-[#0B1220]/90 p-4 transition hover:border-white/15 hover:bg-white/[0.04] sm:p-5",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className={cn("mt-2 text-3xl font-bold text-white", item.accent)}>
                  {value}
                </p>
              </div>
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10",
                  item.iconBg,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
