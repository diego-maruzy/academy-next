import { createSupabaseReadServerClient } from "@/lib/supabase/server";

type SupabaseQueryError = {
  code?: string;
  message?: string;
};

let webhookEventsTableAvailable: boolean | undefined;

export type DashboardStats = {
  totalClients: number;
  publishedPrograms: number;
  totalModules: number;
  totalLessons: number;
  webhookEvents: number;
  activeConnections: number;
};

export type DailyCount = {
  date: string;
  label: string;
  count: number;
};

// Quando o Keycloak/login estiver ativo, substituir ou complementar
// webhook_events por user_access_logs.
export type RecentActivity = {
  id: string;
  type: "webhook" | "login" | "lesson_completed";
  title: string;
  description: string;
  status: "success" | "error" | "info";
  created_at: string;
};

export type ProgramSummary = {
  totalPrograms: number;
  publishedPrograms: number;
  premiumPrograms: number;
  totalModules: number;
  totalLessons: number;
};

export type ClientSummary = {
  totalClients: number;
  signupsLast30Days: DailyCount[];
};

export type ConnectionSummary = {
  activeConnections: number;
  totalEvents: number;
  successEvents: number;
  errorEvents: number;
};

type WebhookEventRow = {
  id: string;
  webhook_connection_id: string | null;
  status: string;
  error_message: string | null;
  created_client_id: string | null;
  created_at: string;
};

async function getReadClient() {
  return createSupabaseReadServerClient();
}

function isMissingTableError(error: SupabaseQueryError) {
  return (
    error.code === "PGRST205" ||
    Boolean(error.message?.includes("Could not find the table")) ||
    Boolean(
      error.message?.includes("relation") &&
        error.message?.includes("does not exist"),
    )
  );
}

function logDashboardError(context: string, error: SupabaseQueryError) {
  if (isMissingTableError(error)) {
    return;
  }

  console.error(`[dashboard-data] ${context}:`, error.message);
}

async function hasWebhookEventsTable(): Promise<boolean> {
  if (webhookEventsTableAvailable !== undefined) {
    return webhookEventsTableAvailable;
  }

  const supabase = await getReadClient();

  if (!supabase) {
    webhookEventsTableAvailable = false;
    return false;
  }

  const { error } = await supabase
    .from("webhook_events")
    .select("id", { head: true, count: "exact" });

  if (error && isMissingTableError(error)) {
    webhookEventsTableAvailable = false;
    return false;
  }

  if (error) {
    logDashboardError("Erro ao verificar tabela webhook_events", error);
    webhookEventsTableAvailable = false;
    return false;
  }

  webhookEventsTableAvailable = true;
  return true;
}

async function safeCount(
  table: string,
  equals?: { column: string; value: string | boolean },
): Promise<number> {
  const supabase = await getReadClient();

  if (!supabase) {
    return 0;
  }

  let query = supabase.from(table).select("*", { count: "exact", head: true });

  if (equals) {
    query = query.eq(equals.column, equals.value);
  }

  const { count, error } = await query;

  if (error) {
    logDashboardError(`Erro ao contar ${table}`, error);
    return 0;
  }

  return count ?? 0;
}

function buildLast30DaysSeries(countsByDate: Map<string, number>): DailyCount[] {
  const result: DailyCount[] = [];
  const today = new Date();

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const dateKey = date.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(date);

    result.push({
      date: dateKey,
      label,
      count: countsByDate.get(dateKey) ?? 0,
    });
  }

  return result;
}

function groupByDay(timestamps: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const timestamp of timestamps) {
    const dateKey = timestamp.slice(0, 10);
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  return counts;
}

function getThirtyDaysAgoIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 29);
  return date.toISOString();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const eventsTableAvailable = await hasWebhookEventsTable();

  const [
    totalClients,
    publishedPrograms,
    totalModules,
    totalLessons,
    webhookEventsFromTable,
    activeConnections,
    connectionSummary,
  ] = await Promise.all([
    safeCount("clients"),
    safeCount("programs", { column: "published", value: true }),
    safeCount("modules"),
    safeCount("lessons"),
    eventsTableAvailable ? safeCount("webhook_events") : Promise.resolve(0),
    safeCount("webhook_connections", { column: "status", value: "active" }),
    eventsTableAvailable ? Promise.resolve(null) : getConnectionSummary(),
  ]);

  const webhookEvents = eventsTableAvailable
    ? webhookEventsFromTable
    : (connectionSummary?.totalEvents ?? 0);

  return {
    totalClients,
    publishedPrograms,
    totalModules,
    totalLessons,
    webhookEvents,
    activeConnections,
  };
}

async function getWebhookActivityFromConnections(): Promise<DailyCount[]> {
  const supabase = await getReadClient();

  if (!supabase) {
    return buildLast30DaysSeries(new Map());
  }

  const { data, error } = await supabase
    .from("webhook_connections")
    .select("last_event_at")
    .not("last_event_at", "is", null)
    .gte("last_event_at", getThirtyDaysAgoIso());

  if (error) {
    logDashboardError("Erro ao buscar atividade via conexões", error);
    return buildLast30DaysSeries(new Map());
  }

  const timestamps = (data ?? []).map((row) => row.last_event_at as string);
  return buildLast30DaysSeries(groupByDay(timestamps));
}

export async function getWebhookActivityLast30Days(): Promise<DailyCount[]> {
  const eventsTableAvailable = await hasWebhookEventsTable();
  const supabase = await getReadClient();

  if (!supabase) {
    return buildLast30DaysSeries(new Map());
  }

  if (!eventsTableAvailable) {
    return getWebhookActivityFromConnections();
  }

  const { data, error } = await supabase
    .from("webhook_events")
    .select("created_at")
    .gte("created_at", getThirtyDaysAgoIso());

  if (error) {
    logDashboardError("Erro ao buscar atividade de webhooks", error);

    if (isMissingTableError(error)) {
      webhookEventsTableAvailable = false;
      return getWebhookActivityFromConnections();
    }

    return buildLast30DaysSeries(new Map());
  }

  const timestamps = (data ?? []).map((row) => row.created_at as string);
  return buildLast30DaysSeries(groupByDay(timestamps));
}

export async function getClientSummary(): Promise<ClientSummary> {
  const supabase = await getReadClient();

  if (!supabase) {
    return {
      totalClients: 0,
      signupsLast30Days: buildLast30DaysSeries(new Map()),
    };
  }

  const [totalResult, recentResult] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase
      .from("clients")
      .select("created_at")
      .gte("created_at", getThirtyDaysAgoIso()),
  ]);

  if (totalResult.error) {
    logDashboardError("Erro ao buscar total de clientes", totalResult.error);
  }

  if (recentResult.error) {
    logDashboardError("Erro ao buscar novos clientes", recentResult.error);
  }

  const timestamps = (recentResult.data ?? []).map(
    (row) => row.created_at as string,
  );

  return {
    totalClients: totalResult.count ?? 0,
    signupsLast30Days: buildLast30DaysSeries(groupByDay(timestamps)),
  };
}

async function getRecentActivityFromConnections(
  limit = 5,
): Promise<RecentActivity[]> {
  const supabase = await getReadClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("webhook_connections")
    .select("id, name, last_event_at, success_events, error_events")
    .not("last_event_at", "is", null)
    .order("last_event_at", { ascending: false })
    .limit(limit);

  if (error) {
    logDashboardError("Erro ao buscar atividade via conexões", error);
    return [];
  }

  return (data ?? []).map((connection) => ({
    id: connection.id as string,
    type: "webhook" as const,
    title: connection.name as string,
    description: `${connection.success_events ?? 0} sucessos · ${connection.error_events ?? 0} erros`,
    status: "info" as const,
    created_at: connection.last_event_at as string,
  }));
}

export async function getRecentWebhookEvents(
  limit = 5,
): Promise<RecentActivity[]> {
  const eventsTableAvailable = await hasWebhookEventsTable();
  const supabase = await getReadClient();

  if (!supabase) {
    return [];
  }

  if (!eventsTableAvailable) {
    return getRecentActivityFromConnections(limit);
  }

  const { data, error } = await supabase
    .from("webhook_events")
    .select(
      "id, webhook_connection_id, status, error_message, created_client_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logDashboardError("Erro ao buscar eventos recentes", error);

    if (isMissingTableError(error)) {
      webhookEventsTableAvailable = false;
      return getRecentActivityFromConnections(limit);
    }

    return [];
  }

  const events = (data ?? []) as WebhookEventRow[];

  if (events.length === 0) {
    return [];
  }

  const connectionIds = [
    ...new Set(
      events
        .map((event) => event.webhook_connection_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const clientIds = [
    ...new Set(
      events
        .map((event) => event.created_client_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [connectionsResult, clientsResult] = await Promise.all([
    connectionIds.length > 0
      ? supabase
          .from("webhook_connections")
          .select("id, name")
          .in("id", connectionIds)
      : Promise.resolve({ data: [], error: null }),
    clientIds.length > 0
      ? supabase.from("clients").select("id, email").in("id", clientIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (connectionsResult.error) {
    logDashboardError("Erro ao buscar conexões dos eventos", connectionsResult.error);
  }

  if (clientsResult.error) {
    logDashboardError("Erro ao buscar clientes dos eventos", clientsResult.error);
  }

  const connectionNames = new Map(
    (connectionsResult.data ?? []).map((connection) => [
      connection.id as string,
      connection.name as string,
    ]),
  );

  const clientEmails = new Map(
    (clientsResult.data ?? []).map((client) => [
      client.id as string,
      client.email as string,
    ]),
  );

  return events.map((event) => {
    const connectionName = event.webhook_connection_id
      ? (connectionNames.get(event.webhook_connection_id) ?? null)
      : null;
    const clientEmail = event.created_client_id
      ? (clientEmails.get(event.created_client_id) ?? null)
      : null;

    const status =
      event.status === "success"
        ? "success"
        : event.status === "error"
          ? "error"
          : "info";

    return {
      id: event.id,
      type: "webhook" as const,
      title: connectionName ?? "Webhook",
      description: clientEmail
        ? `Cliente: ${clientEmail}`
        : event.error_message
          ? event.error_message
          : "Evento processado",
      status,
      created_at: event.created_at,
    };
  });
}

export async function getProgramSummary(): Promise<ProgramSummary> {
  const supabase = await getReadClient();

  if (!supabase) {
    return {
      totalPrograms: 0,
      publishedPrograms: 0,
      premiumPrograms: 0,
      totalModules: 0,
      totalLessons: 0,
    };
  }

  const [programsResult, modulesCount, lessonsCount] = await Promise.all([
    supabase.from("programs").select("published, is_premium"),
    safeCount("modules"),
    safeCount("lessons"),
  ]);

  if (programsResult.error) {
    logDashboardError("Erro ao buscar programas", programsResult.error);

    return {
      totalPrograms: 0,
      publishedPrograms: 0,
      premiumPrograms: 0,
      totalModules: modulesCount,
      totalLessons: lessonsCount,
    };
  }

  const programs = programsResult.data ?? [];

  return {
    totalPrograms: programs.length,
    publishedPrograms: programs.filter((program) => program.published).length,
    premiumPrograms: programs.filter((program) => program.is_premium).length,
    totalModules: modulesCount,
    totalLessons: lessonsCount,
  };
}

export async function getConnectionSummary(): Promise<ConnectionSummary> {
  const supabase = await getReadClient();

  if (!supabase) {
    return {
      activeConnections: 0,
      totalEvents: 0,
      successEvents: 0,
      errorEvents: 0,
    };
  }

  const { data, error } = await supabase
    .from("webhook_connections")
    .select("status, total_events, success_events, error_events");

  if (error) {
    logDashboardError("Erro ao buscar resumo de conexões", error);

    return {
      activeConnections: 0,
      totalEvents: 0,
      successEvents: 0,
      errorEvents: 0,
    };
  }

  return (data ?? []).reduce<ConnectionSummary>(
    (summary, connection) => ({
      activeConnections:
        summary.activeConnections +
        (connection.status === "active" ? 1 : 0),
      totalEvents: summary.totalEvents + (connection.total_events ?? 0),
      successEvents: summary.successEvents + (connection.success_events ?? 0),
      errorEvents: summary.errorEvents + (connection.error_events ?? 0),
    }),
    {
      activeConnections: 0,
      totalEvents: 0,
      successEvents: 0,
      errorEvents: 0,
    },
  );
}
