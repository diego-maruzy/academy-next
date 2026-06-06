"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  MonitorPlay,
} from "lucide-react";
import { formatDuration, formatRelativeOrDate } from "@/lib/formatters/time";
import type { ClientAnalytics } from "@/types/client-analytics";
import { cn } from "@/lib/utils";

type ClientAnalyticsPanelProps = {
  clientId: string;
};

function ProgressStatusBadge({
  status,
}: {
  status: ClientAnalytics["programProgress"][number]["status"];
}) {
  const styles = {
    completed: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    in_progress: "border-blue-400/25 bg-blue-400/10 text-blue-200",
    not_started: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  } as const;

  const labels = {
    completed: "Concluído",
    in_progress: "Em andamento",
    not_started: "Não iniciado",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

function ActivityIcon({ eventType }: { eventType: string }) {
  if (eventType === "lesson_completed") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }

  if (eventType === "platform_access") {
    return <MonitorPlay className="h-4 w-4 text-blue-400" />;
  }

  return <BookOpen className="h-4 w-4 text-violet-400" />;
}

export function ClientAnalyticsPanel({ clientId }: ClientAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/clients/${clientId}/analytics`);
        const result = (await response.json()) as {
          success?: boolean;
          analytics?: ClientAnalytics;
          message?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !result.success || !result.analytics) {
          setError(
            result.message ?? "Não foi possível carregar analytics do cliente.",
          );
          setAnalytics(null);
          return;
        }

        setAnalytics(result.analytics);
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar analytics do cliente.");
          setAnalytics(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0B1220]/60 py-12 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando atividade...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const hasActivity =
    analytics.recentActivity.length > 0 ||
    analytics.accessedPrograms.length > 0 ||
    analytics.totalTimeSeconds > 0;

  const kpis = [
    {
      label: "Tempo na plataforma",
      value: formatDuration(analytics.totalTimeSeconds),
      icon: Clock3,
    },
    {
      label: "Último acesso",
      value: formatRelativeOrDate(analytics.lastAccessAt),
      icon: Activity,
    },
    {
      label: "Programas acessados",
      value: String(analytics.accessedPrograms.length),
      icon: BookOpen,
    },
    {
      label: "Programas concluídos",
      value: String(analytics.completedPrograms.length),
      icon: GraduationCap,
    },
    {
      label: "Aulas concluídas",
      value: String(analytics.completedLessonsCount),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-300">
          Atividade na plataforma
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          Engajamento do aluno
        </h3>
      </div>

      {!hasActivity ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1220]/50 p-6 text-sm text-slate-400">
          Ainda não há atividade registrada para este cliente.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-white/10 bg-[#0B1220]/80 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icon className="h-4 w-4" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                      {kpi.label}
                    </p>
                  </div>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {kpi.value}
                  </p>
                </div>
              );
            })}
          </div>

          {analytics.programProgress.length > 0 ? (
            <section className="grid gap-3">
              <h4 className="text-sm font-semibold text-white">
                Programas acessados
              </h4>
              <div className="grid gap-3">
                {analytics.programProgress.map((program) => (
                  <div
                    key={program.programId}
                    className="rounded-2xl border border-white/10 bg-[#0B1220]/70 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-semibold text-white">
                          {program.programName}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {program.completedLessons}/{program.totalLessons} aulas
                          · Último acesso{" "}
                          {formatRelativeOrDate(program.lastAccessAt)}
                        </p>
                      </div>
                      <ProgressStatusBadge status={program.status} />
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          program.status === "completed"
                            ? "bg-emerald-400"
                            : "bg-blue-400",
                        )}
                        style={{ width: `${program.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {analytics.completedPrograms.length > 0 ? (
            <section className="grid gap-3">
              <h4 className="text-sm font-semibold text-white">
                Programas concluídos
              </h4>
              <div className="flex flex-wrap gap-2">
                {analytics.completedPrograms.map((program) => (
                  <span
                    key={program.id}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {program.name}
                    {program.completedAt ? (
                      <span className="text-emerald-300/70">
                        · {formatRelativeOrDate(program.completedAt)}
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {analytics.recentActivity.length > 0 ? (
            <section className="grid gap-3">
              <h4 className="text-sm font-semibold text-white">
                Últimas atividades
              </h4>
              <div className="grid gap-2">
                {analytics.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                  >
                    <div className="mt-0.5 rounded-lg border border-white/10 bg-slate-950/70 p-2">
                      <ActivityIcon eventType={item.eventType} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">{item.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatRelativeOrDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
