import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  normalizeClientPlan,
  type ClientPlan,
} from "@/lib/clients/client-access";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";
import { incomingWebhookSchema } from "@/lib/validations/webhook";

type WebhookRouteContext = {
  params: Promise<{ webhookId: string }>;
};

type WebhookEndpointRow = {
  id: string;
  name: string | null;
  slug: string | null;
  token: string | null;
  default_password: string | null;
  source: string | null;
  enabled: boolean | null;
  last_triggered_at: string | null;
  trigger_count: number | null;
  default_role: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ProfileRecord = {
  id: string;
  email: string | null;
  display_name: string | null;
};

const FALLBACK_CLIENT_PASSWORD = "fliphouse2026";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizePayloadForStorage(payload: {
  name: string;
  email: string;
  phone?: string;
}) {
  return {
    name: payload.name.trim(),
    email: normalizeEmail(payload.email),
    phone: payload.phone?.trim() || null,
  };
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);

  return {
    first_name: parts[0] ?? null,
    last_name: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function resolveWebhookClientPlan(
  roleOrPlan: string | null | undefined,
): ClientPlan {
  const value = String(roleOrPlan ?? "")
    .trim()
    .toLowerCase();

  return value === "premium" ? "premium" : "free";
}

function getWebhookPassword(endpoint: WebhookEndpointRow) {
  return endpoint.default_password?.trim() || FALLBACK_CLIENT_PASSWORD;
}

function getWebhookSource(endpoint: WebhookEndpointRow) {
  return endpoint.source || endpoint.name || endpoint.slug || "webhook";
}

function getSourceRole(endpoint: WebhookEndpointRow, plan: ClientPlan) {
  return endpoint.default_role || `webhook_${plan}`;
}

function isAuthorizedWebhookRequest(
  request: Request,
  endpoint: WebhookEndpointRow,
) {
  const expectedToken = endpoint.token?.trim();

  if (!expectedToken) {
    return true;
  }

  const providedToken =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-webhook-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return providedToken?.trim() === expectedToken;
}

async function incrementWebhookStats(endpoint: WebhookEndpointRow) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("webhook_endpoints")
    .update({
      trigger_count: Number(endpoint.trigger_count ?? 0) + 1,
      last_triggered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", endpoint.id);

  if (error) {
    console.error("[webhook] Erro ao atualizar estatísticas:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

async function logWebhookEvent(params: {
  webhookId: string;
  status: "success" | "error";
  payload: Record<string, unknown>;
  errorMessage?: string | null;
  createdClientId?: string | null;
}) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("webhook_events").insert({
    webhook_id: params.webhookId,
    status: params.status,
    payload: params.payload,
    error_message: params.errorMessage ?? null,
    created_client_id: params.createdClientId ?? null,
  });

  if (error) {
    console.error("[webhook] Erro ao registrar evento:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

async function upsertClientAccess(params: {
  userId: string;
  plan: ClientPlan;
  sourceRole: string | null;
}) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  const { error } = await supabase.from("client_access").upsert(
    {
      user_id: params.userId,
      plan: normalizeClientPlan(params.plan),
      status: "active",
      source_role: params.sourceRole,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function updateAuthUserMetadata(params: {
  userId: string;
  email: string;
  name: string;
  plan: ClientPlan;
}) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(params.userId, {
    email: params.email,
    email_confirm: true,
    user_metadata: {
      display_name: params.name,
      full_name: params.name,
      plan: params.plan,
      source: "webhook",
    },
  });

  if (error) {
    console.warn("[webhook] Não foi possível atualizar usuário Auth:", {
      userId: params.userId,
      message: error.message,
    });
  }
}

async function createAuthUser(params: {
  email: string;
  name: string;
  plan: ClientPlan;
  password: string;
}) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      display_name: params.name,
      full_name: params.name,
      plan: params.plan,
      source: "webhook",
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user?.id) {
    throw new Error("Usuário Auth criado sem ID.");
  }

  return data.user.id;
}

async function findProfileByEmail(email: string) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProfileRecord | null) ?? null;
}

async function upsertProfile(params: {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
}) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    throw new Error("Supabase não configurado.");
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: params.userId,
        display_name: params.name,
        email: params.email,
        whatsapp: params.phone,
        auth_provider: params.source,
        status: "active",
        created_at: now,
        updated_at: now,
        ...splitName(params.name),
      },
      {
        onConflict: "id",
      },
    )
    .select("id, email, display_name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProfileRecord;
}

export async function POST(request: Request, context: WebhookRouteContext) {
  const { webhookId } = await context.params;

  const payload: unknown = await request.json().catch(() => null);
  const parsedPayload = incomingWebhookSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Dados inválidos para o webhook.",
        errors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, email, phone } = parsedPayload.data;

  const safePayload = sanitizePayloadForStorage({
    name,
    email,
    phone,
  });

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

  const { data: endpointData, error: endpointError } = await supabase
    .from("webhook_endpoints")
    .select(
      "id, name, slug, token, default_password, source, enabled, last_triggered_at, trigger_count, default_role, created_at, updated_at",
    )
    .eq("slug", webhookId)
    .maybeSingle();

  if (endpointError) {
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar webhook.",
      },
      { status: 500 },
    );
  }

  const endpoint = (endpointData as WebhookEndpointRow | null) ?? null;

  if (!endpoint) {
    return NextResponse.json(
      {
        success: false,
        message: "Webhook não encontrado.",
      },
      { status: 404 },
    );
  }

  if (endpoint.enabled === false) {
    await incrementWebhookStats(endpoint);

    await logWebhookEvent({
      webhookId: endpoint.id,
      status: "error",
      payload: safePayload,
      errorMessage: "Webhook inativo.",
    });

    return NextResponse.json(
      {
        success: false,
        message: "Webhook inativo.",
      },
      { status: 403 },
    );
  }

  if (!isAuthorizedWebhookRequest(request, endpoint)) {
    await incrementWebhookStats(endpoint);

    await logWebhookEvent({
      webhookId: endpoint.id,
      status: "error",
      payload: safePayload,
      errorMessage: "Token inválido.",
    });

    return NextResponse.json(
      {
        success: false,
        message: "Token inválido.",
      },
      { status: 401 },
    );
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = name.trim();
    const normalizedPhone = phone?.trim() || null;

    const plan = resolveWebhookClientPlan(endpoint.default_role);
    const source = getWebhookSource(endpoint);
    const sourceRole = getSourceRole(endpoint, plan);
    const defaultPassword = getWebhookPassword(endpoint);

    const existingProfile = await findProfileByEmail(normalizedEmail);

    let profileRecord: ProfileRecord;

    if (existingProfile) {
      profileRecord = await upsertProfile({
        userId: existingProfile.id,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        source,
      });

      await updateAuthUserMetadata({
        userId: existingProfile.id,
        email: normalizedEmail,
        name: normalizedName,
        plan,
      });
    } else {
      const authUserId = await createAuthUser({
        email: normalizedEmail,
        name: normalizedName,
        plan,
        password: defaultPassword,
      });

      profileRecord = await upsertProfile({
        userId: authUserId,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        source,
      });
    }

    await upsertClientAccess({
      userId: profileRecord.id,
      plan,
      sourceRole,
    });

    await incrementWebhookStats(endpoint);

    await logWebhookEvent({
      webhookId: endpoint.id,
      status: "success",
      payload: safePayload,
      createdClientId: profileRecord.id,
    });

    revalidatePath("/clientes");
    revalidatePath("/conexoes");
    revalidatePath("/dashboard");

    return NextResponse.json({
      success: true,
      message: "Cliente criado ou atualizado com sucesso.",
      client: {
        id: profileRecord.id,
        email: profileRecord.email,
        full_name: profileRecord.display_name,
        plan,
        planLabel: plan === "premium" ? "Premium" : "Free",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao processar webhook.";

    await incrementWebhookStats(endpoint);

    await logWebhookEvent({
      webhookId: endpoint.id,
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