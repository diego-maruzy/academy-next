import { cn } from "@/lib/utils";
import type { ClientStatus, TeamStatus } from "@/lib/admin-labels";

type StatusBadgeProps = {
  status: ClientStatus | TeamStatus;
  label: string;
  className?: string;
};

const statusStyles: Record<string, string> = {
  active: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  pending: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  invited: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  inactive: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  blocked: "border-red-400/25 bg-red-400/10 text-red-300",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        statusStyles[status] ?? "border-white/10 bg-white/5 text-slate-300",
        className,
      )}
    >
      {label}
    </span>
  );
}
