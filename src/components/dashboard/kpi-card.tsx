import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: string;
  compact?: boolean;
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "text-emerald-300",
  compact = false,
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className={cn("pt-6", compact && "py-5")}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">{label}</p>
            <strong
              className={cn(
                "mt-3 block font-semibold text-white",
                compact ? "text-2xl" : "text-4xl",
              )}
            >
              {value}
            </strong>
          </div>
          <div
            className={cn(
              "rounded-2xl bg-white/5 p-3",
              tone,
              compact && "p-2.5",
            )}
          >
            <Icon className={cn("h-6 w-6", compact && "h-5 w-5")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
