import { cn } from "@/lib/utils";

type ClientPlanBadgeProps = {
  label: string;
  isPremium: boolean;
  className?: string;
};

export function ClientPlanBadge({
  label,
  isPremium,
  className,
}: ClientPlanBadgeProps) {
  const isUnknown = label === "Plano não identificado";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        isPremium
          ? "border-violet-400/25 bg-violet-400/10 text-violet-200"
          : isUnknown
            ? "border-white/10 bg-white/5 text-slate-500"
            : "border-sky-400/20 bg-sky-400/10 text-sky-200",
        className,
      )}
    >
      {label}
    </span>
  );
}
