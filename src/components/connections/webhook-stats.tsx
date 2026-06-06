import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Inbox,
  Plug,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { WebhookStatsSummary } from "@/lib/webhooks-data";

type WebhookStatsProps = {
  stats: WebhookStatsSummary;
};

export function WebhookStats({ stats }: WebhookStatsProps) {
  const items: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    tone: string;
  }> = [
    {
      label: "Eventos recebidos",
      value: String(stats.totalEvents),
      icon: Inbox,
      tone: "text-blue-300",
    },
    {
      label: "Sucessos",
      value: String(stats.successEvents),
      icon: CheckCircle2,
      tone: "text-emerald-300",
    },
    {
      label: "Erros",
      value: String(stats.errorEvents),
      icon: XCircle,
      tone: "text-red-300",
    },
    {
      label: "Conexões ativas",
      value: String(stats.activeConnections),
      icon: Plug,
      tone: "text-violet-300",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <strong className="mt-3 block text-3xl font-semibold text-white">
                    {stat.value}
                  </strong>
                </div>
                <div className={`rounded-2xl bg-white/5 p-3 ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
