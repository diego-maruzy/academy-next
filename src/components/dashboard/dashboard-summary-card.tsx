import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type SummaryItem = {
  label: string;
  value: number | string;
};

type DashboardSummaryCardProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  items: SummaryItem[];
  accent?: string;
};

export function DashboardSummaryCard({
  title,
  description,
  icon: Icon,
  items,
  accent = "text-blue-300",
}: DashboardSummaryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className={`rounded-2xl bg-white/5 p-3 ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <dt className="text-sm text-slate-400">{item.label}</dt>
              <dd className="text-sm font-semibold text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
