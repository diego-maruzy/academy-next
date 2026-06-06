import {
  BookOpen,
  Cable,
  GraduationCap,
  Inbox,
  Layers3,
  Plug,
  Users,
} from "lucide-react";
import { ActivityLineChart } from "@/components/dashboard/activity-line-chart";
import { ClientsBarChart } from "@/components/dashboard/clients-bar-chart";
import { DashboardSummaryCard } from "@/components/dashboard/dashboard-summary-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentEventsList } from "@/components/dashboard/recent-events-list";
import {
  getClientSummary,
  getConnectionSummary,
  getDashboardStats,
  getProgramSummary,
  getRecentWebhookEvents,
  getWebhookActivityLast30Days,
} from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    stats,
    webhookActivity,
    clientSummary,
    recentEvents,
    programSummary,
    connectionSummary,
  ] = await Promise.all([
    getDashboardStats(),
    getWebhookActivityLast30Days(),
    getClientSummary(),
    getRecentWebhookEvents(5),
    getProgramSummary(),
    getConnectionSummary(),
  ]);

  return (
      <div className="grid gap-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Visão geral
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Visão geral da operação da Academy.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Clientes totais"
            value={stats.totalClients}
            icon={Users}
            tone="text-blue-300"
          />
          <KpiCard
            label="Programas publicados"
            value={stats.publishedPrograms}
            icon={BookOpen}
            tone="text-emerald-300"
          />
          <KpiCard
            label="Aulas cadastradas"
            value={stats.totalLessons}
            icon={GraduationCap}
            tone="text-violet-300"
          />
          <KpiCard
            label="Leads via webhook"
            value={stats.webhookEvents}
            icon={Inbox}
            tone="text-amber-300"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <KpiCard
            label="Módulos cadastrados"
            value={stats.totalModules}
            icon={Layers3}
            tone="text-cyan-300"
            compact
          />
          <KpiCard
            label="Conexões ativas"
            value={stats.activeConnections}
            icon={Plug}
            tone="text-violet-300"
            compact
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <ActivityLineChart data={webhookActivity} />
          <ClientsBarChart data={clientSummary.signupsLast30Days} />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentEventsList events={recentEvents} />
          </div>
          <div className="grid gap-4">
            <DashboardSummaryCard
              title="Resumo dos programas"
              description="Estrutura educacional cadastrada no Supabase."
              icon={BookOpen}
              accent="text-emerald-300"
              items={[
                { label: "Total de programas", value: programSummary.totalPrograms },
                {
                  label: "Publicados",
                  value: programSummary.publishedPrograms,
                },
                { label: "Premium", value: programSummary.premiumPrograms },
                { label: "Total de módulos", value: programSummary.totalModules },
                { label: "Total de aulas", value: programSummary.totalLessons },
              ]}
            />
            <DashboardSummaryCard
              title="Resumo de conexões"
              description="Integrações e eventos recebidos via webhook."
              icon={Cable}
              accent="text-blue-300"
              items={[
                {
                  label: "Conexões ativas",
                  value: connectionSummary.activeConnections,
                },
                { label: "Eventos totais", value: connectionSummary.totalEvents },
                { label: "Sucessos", value: connectionSummary.successEvents },
                { label: "Erros", value: connectionSummary.errorEvents },
              ]}
            />
          </div>
        </section>
      </div>
  );
}
