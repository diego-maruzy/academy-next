import { Crown, Sparkles, UserCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientStats = {
  total: number;
  active: number;
  free: number;
  premium: number;
};

type ClientStatsCardsProps = {
  stats: ClientStats;
};

const cards = [
  {
    key: "total" as const,
    label: "Total de clientes",
    icon: Users,
    accent: "text-slate-200",
    iconBg: "border-white/10 bg-white/5 text-slate-300",
  },
  {
    key: "active" as const,
    label: "Clientes ativos",
    icon: UserCheck,
    accent: "text-emerald-300",
    iconBg: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  },
  {
    key: "free" as const,
    label: "Clientes free",
    icon: Sparkles,
    accent: "text-sky-300",
    iconBg: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  },
  {
    key: "premium" as const,
    label: "Clientes premium",
    icon: Crown,
    accent: "text-violet-300",
    iconBg: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  },
];

export function ClientStatsCards({ stats }: ClientStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <div
            key={card.key}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-white/15"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {card.label}
                </p>
                <p
                  className={cn(
                    "mt-2 text-2xl font-bold tracking-tight sm:text-3xl",
                    card.accent,
                  )}
                >
                  {value}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                  card.iconBg,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
