import { createSupabaseReadServerClient } from "@/lib/supabase/server";
import { getWebhookPublicUrl } from "@/lib/webhook-url";

export type WebhookConnectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  role: string;
  program_id: string | null;
  status: string;
  secret_token: string | null;
  total_events: number;
  success_events: number;
  error_events: number;
  last_event_at: string | null;
  created_at: string;
  updated_at: string;
  programs?: { name: string } | { name: string }[] | null;
};

export type WebhookStatsSummary = {
  totalEvents: number;
  successEvents: number;
  errorEvents: number;
  activeConnections: number;
};

export type WebhookConnectionView = WebhookConnectionRow & {
  url: string;
  programName: string | null;
};

function getProgramName(connection: WebhookConnectionRow) {
  if (!connection.programs) {
    return null;
  }

  if (Array.isArray(connection.programs)) {
    return connection.programs[0]?.name ?? null;
  }

  return connection.programs.name ?? null;
}

export async function getWebhookConnections(): Promise<WebhookConnectionView[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    console.error("Supabase não configurado para buscar conexões.");
    return [];
  }

  const { data, error } = await supabase
    .from("webhook_connections")
    .select("*, programs(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar conexões:", error.message);
    return [];
  }

  return ((data ?? []) as WebhookConnectionRow[]).map((connection) => ({
    ...connection,
    url: getWebhookPublicUrl(connection.slug),
    programName: getProgramName(connection),
  }));
}

export async function getWebhookStats(): Promise<WebhookStatsSummary> {
  const connections = await getWebhookConnections();

  return connections.reduce<WebhookStatsSummary>(
    (summary, connection) => ({
      totalEvents: summary.totalEvents + connection.total_events,
      successEvents: summary.successEvents + connection.success_events,
      errorEvents: summary.errorEvents + connection.error_events,
      activeConnections:
        summary.activeConnections +
        (connection.status === "active" ? 1 : 0),
    }),
    {
      totalEvents: 0,
      successEvents: 0,
      errorEvents: 0,
      activeConnections: 0,
    },
  );
}

export async function getWebhookConnectionBySlug(slug: string) {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("webhook_connections")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar conexão:", error.message);
    return null;
  }

  return (data as WebhookConnectionRow | null) ?? null;
}
