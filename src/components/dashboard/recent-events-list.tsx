import { Activity, CheckCircle2, Inbox, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDateTime } from "@/lib/admin-labels";
import type { RecentActivity } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

type RecentEventsListProps = {
  events: RecentActivity[];
};

// Quando o Keycloak/login estiver ativo, substituir ou complementar
// webhook_events por user_access_logs.
function statusMeta(status: RecentActivity["status"]) {
  if (status === "success") {
    return {
      label: "Sucesso",
      icon: CheckCircle2,
      className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    };
  }

  if (status === "error") {
    return {
      label: "Erro",
      icon: XCircle,
      className: "border-red-400/20 bg-red-400/10 text-red-300",
    };
  }

  return {
    label: "Info",
    icon: Activity,
    className: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  };
}

export function RecentEventsList({ events }: RecentEventsListProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/5 p-3 text-violet-300">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Últimos eventos</h2>
            <p className="mt-1 text-sm text-slate-400">
              Os 5 registros mais recentes de webhook_events.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
            <Inbox className="mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm font-medium text-white">
              Nenhum evento registrado ainda.
            </p>
            <p className="mt-2 max-w-sm text-sm text-slate-400">
              Quando webhooks forem recebidos, eles aparecerão aqui em tempo
              real.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {events.map((event) => {
              const meta = statusMeta(event.status);
              const StatusIcon = meta.icon;

              return (
                <li
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                            meta.className,
                          )}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                        <span className="text-sm font-medium text-white">
                          {event.title}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {event.description}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-500">
                      {formatDateTime(event.created_at)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
