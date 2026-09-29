import { createSupabaseReadServerClient } from "@/lib/supabase/server";

type SupabaseQueryError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
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

// Quando o login do aluno estiver ativo, substituir ou complementar
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
  webhook_id: string | null;
  status: string;
  error_message: string | null;
  created_client_id: string | null;
  created_at: string;
};

type WebhookEndpointRow = {
  id: string;
  name: string | null;
  slug: string | null;
  source: string | null;
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

  console.error(`[dashboard-data] ${context}:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

function resolveEndpointDisplayName(endpoint: {
  name?: string | null;
  slug?: string | null;
  source?: string | null;
}) {
  return endpoint.name?.trim() || endpoint.slug?.trim() || endpoint.source?.trim() || "Webhook";
}

function buildEndpointNamesMap(endpoints: WebhookEndpointRow[]) {
  return new Map(
    endpoints.map((endpoint) => [
      endpoint.id,
      resolveEndpointDisplayName(endpoint),
    ]),
  );
}

async function fetchEndpointNamesByIds(
  webhookIds: string[],
): Promise<Map<string, string>> {
  if (webhookIds.length === 0) {
    return new Map();
  }

  const supabase = await getReadClient();

  if (!supabase) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .select("id, name, slug, source")
    .in("id", webhookIds);

  if (error) {
    logDashboardError("Erro ao buscar endpoints dos eventos", error);
    return new Map();
  }

  return buildEndpointNamesMap((data ?? []) as WebhookEndpointRow[]);
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
    safeCount("profiles"),
    safeCount("programs", { column: "published", value: true }),
    safeCount("modules"),
    safeCount("lessons"),
    eventsTableAvailable ? safeCount("webhook_events") : Promise.resolve(0),
    safeCount("webhook_endpoints", { column: "enabled", value: true }),
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

async function getWebhookActivityFromEndpoints(): Promise<DailyCount[]> {
  const supabase = await getReadClient();

  if (!supabase) {
    return buildLast30DaysSeries(new Map());
  }

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .select("last_triggered_at")
    .not("last_triggered_at", "is", null)
    .gte("last_triggered_at", getThirtyDaysAgoIso());

  if (error) {
    logDashboardError("Erro ao buscar atividade via endpoints", error);
    return buildLast30DaysSeries(new Map());
  }

  const timestamps = (data ?? []).map((row) => row.last_triggered_at as string);
  return buildLast30DaysSeries(groupByDay(timestamps));
}

export async function getWebhookActivityLast30Days(): Promise<DailyCount[]> {
  const eventsTableAvailable = await hasWebhookEventsTable();
  const supabase = await getReadClient();

  if (!supabase) {
    return buildLast30DaysSeries(new Map());
  }

  if (!eventsTableAvailable) {
    return getWebhookActivityFromEndpoints();
  }

  const { data, error } = await supabase
    .from("webhook_events")
    .select("created_at")
    .gte("created_at", getThirtyDaysAgoIso());

  if (error) {
    logDashboardError("Erro ao buscar atividade de webhooks", error);

    if (isMissingTableError(error)) {
      webhookEventsTableAvailable = false;
      return getWebhookActivityFromEndpoints();
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
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
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

async function getRecentActivityFromEndpoints(
  limit = 5,
): Promise<RecentActivity[]> {
  const supabase = await getReadClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .select("id, name, slug, source, last_triggered_at, trigger_count")
    .not("last_triggered_at", "is", null)
    .order("last_triggered_at", { ascending: false })
    .limit(limit);

  if (error) {
    logDashboardError("Erro ao buscar atividade via endpoints", error);
    return [];
  }

  return (data ?? []).map((endpoint) => ({
    id: endpoint.id as string,
    type: "webhook" as const,
    title: resolveEndpointDisplayName({
      name: endpoint.name as string | null,
      slug: endpoint.slug as string | null,
      source: endpoint.source as string | null,
    }),
    description: `${endpoint.trigger_count ?? 0} disparos`,
    status: "info" as const,
    created_at: endpoint.last_triggered_at as string,
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
    return getRecentActivityFromEndpoints(limit);
  }

  const { data, error } = await supabase
    .from("webhook_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logDashboardError("Erro ao buscar eventos recentes", error);

    if (isMissingTableError(error)) {
      webhookEventsTableAvailable = false;
      return getRecentActivityFromEndpoints(limit);
    }

    return [];
  }

  const events = (data ?? []) as WebhookEventRow[];

  if (events.length === 0) {
    return [];
  }

  const webhookIds = [
    ...new Set(
      events
        .map((event) => event.webhook_id)
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

  const [endpointNames, clientsResult] = await Promise.all([
    fetchEndpointNamesByIds(webhookIds),
    clientIds.length > 0
      ? supabase.from("profiles").select("id, email").in("id", clientIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (clientsResult.error) {
    logDashboardError("Erro ao buscar clientes dos eventos", clientsResult.error);
  }

  const clientEmails = new Map(
    (clientsResult.data ?? []).map((client) => [
      client.id as string,
      client.email as string,
    ]),
  );

  return events.map((event) => {
    const endpointName = event.webhook_id
      ? (endpointNames.get(event.webhook_id) ?? "Webhook")
      : "Webhook";
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
      title: endpointName,
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

  const [endpointsResult, eventsResult] = await Promise.all([
    supabase
      .from("webhook_endpoints")
      .select("enabled, trigger_count"),
    supabase.from("webhook_events").select("status"),
  ]);

  if (endpointsResult.error) {
    logDashboardError("Erro ao buscar resumo de endpoints", endpointsResult.error);
  }

  if (eventsResult.error) {
    logDashboardError("Erro ao buscar resumo de eventos", eventsResult.error);
  }

  const endpoints = endpointsResult.data ?? [];
  const events = eventsResult.data ?? [];

  const activeConnections = endpoints.filter((endpoint) => endpoint.enabled).length;

  if (events.length > 0) {
    return {
      activeConnections,
      totalEvents: events.length,
      successEvents: events.filter((event) => event.status === "success").length,
      errorEvents: events.filter((event) => event.status === "error").length,
    };
  }

  const totalEventsFromEndpoints = endpoints.reduce(
    (sum, endpoint) => sum + (endpoint.trigger_count ?? 0),
    0,
  );

  return {
    activeConnections,
    totalEvents: totalEventsFromEndpoints,
    successEvents: 0,
    errorEvents: 0,
  };
}
