import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";
import { incomingWebhookSchema } from "@/lib/validations/webhook";

type WebhookRouteContext = {
  params: Promise<{ webhookId: string }>;
};

function sanitizePayloadForStorage(payload: {
  name: string;
  email: string;
  phone?: string;
}) {
  return {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
  };
}

async function incrementWebhookStats(
  connectionId: string,
  currentStats: {
    total_events: number;
    success_events: number;
    error_events: number;
  },
  outcome: "success" | "error",
) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("webhook_connections")
    .update({
      total_events: currentStats.total_events + 1,
      success_events:
        currentStats.success_events + (outcome === "success" ? 1 : 0),
      error_events: currentStats.error_events + (outcome === "error" ? 1 : 0),
      last_event_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId);
}

async function logWebhookEvent(params: {
  webhookConnectionId: string;
  status: "success" | "error";
  payload: Record<string, unknown>;
  errorMessage?: string | null;
  createdClientId?: string | null;
}) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return;
  }

  await supabase.from("webhook_events").insert({
    webhook_connection_id: params.webhookConnectionId,
    status: params.status,
    payload: params.payload,
    error_message: params.errorMessage ?? null,
    created_client_id: params.createdClientId ?? null,
  });
}

export async function POST(request: Request, context: WebhookRouteContext) {
  const { webhookId } = await context.params;

  // Antes de produção, exigir x-webhook-secret.
  // const providedSecret = request.headers.get("x-webhook-secret");

  const payload: unknown = await request.json().catch(() => null);
  const parsedPayload = incomingWebhookSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Dados inválidos para o webhook",
        errors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, email, phone } = parsedPayload.data;
  const safePayload = sanitizePayloadForStorage({ name, email, phone });

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        message: "Serviço indisponível.",
      },
      { status: 503 },
    );
  }

  const { data: connection, error: connectionError } = await supabase
    .from("webhook_connections")
    .select("*")
    .eq("slug", webhookId)
    .maybeSingle();

  if (connectionError) {
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar conexão.",
      },
      { status: 500 },
    );
  }

  if (!connection) {
    return NextResponse.json(
      {
        success: false,
        message: "Conexão não encontrada.",
      },
      { status: 404 },
    );
  }

  if (connection.status === "inactive") {
    await incrementWebhookStats(
      connection.id,
      {
        total_events: connection.total_events,
        success_events: connection.success_events,
        error_events: connection.error_events,
      },
      "error",
    );

    await logWebhookEvent({
      webhookConnectionId: connection.id,
      status: "error",
      payload: safePayload,
      errorMessage: "Conexão inativa.",
    });

    return NextResponse.json(
      {
        success: false,
        message: "Conexão inativa.",
      },
      { status: 403 },
    );
  }

  try {
    const { data: existingClient, error: existingClientError } = await supabase
      .from("clients")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingClientError) {
      throw new Error(existingClientError.message);
    }

    const clientData = {
      full_name: name,
      email,
      phone: phone ?? null,
      role: connection.role,
      program_id: connection.program_id,
      source: connection.name,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    let clientRecord: { id: string; email: string; full_name: string };

    if (existingClient) {
      const { data: updatedClient, error: updateError } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", existingClient.id)
        .select("id, email, full_name")
        .single();

      if (updateError || !updatedClient) {
        throw new Error(updateError?.message ?? "Erro ao atualizar cliente.");
      }

      clientRecord = updatedClient;
    } else {
      const { data: createdClient, error: createError } = await supabase
        .from("clients")
        .insert(clientData)
        .select("id, email, full_name")
        .single();

      if (createError || !createdClient) {
        throw new Error(createError?.message ?? "Erro ao criar cliente.");
      }

      clientRecord = createdClient;
    }

    await incrementWebhookStats(
      connection.id,
      {
        total_events: connection.total_events,
        success_events: connection.success_events,
        error_events: connection.error_events,
      },
      "success",
    );

    await logWebhookEvent({
      webhookConnectionId: connection.id,
      status: "success",
      payload: safePayload,
      createdClientId: clientRecord.id,
    });

    revalidatePath("/clientes");
    revalidatePath("/conexoes");

    return NextResponse.json({
      success: true,
      message: "Cliente criado ou atualizado com sucesso",
      client: {
        id: clientRecord.id,
        email: clientRecord.email,
        full_name: clientRecord.full_name,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar webhook.";

    await incrementWebhookStats(
      connection.id,
      {
        total_events: connection.total_events,
        success_events: connection.success_events,
        error_events: connection.error_events,
      },
      "error",
    );

    await logWebhookEvent({
      webhookConnectionId: connection.id,
      status: "error",
      payload: safePayload,
      errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
