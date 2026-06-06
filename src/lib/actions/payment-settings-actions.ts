"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { isAdmin } from "@/lib/admin-auth/permissions";
import {
  getPaymentPlanSettingByBillingType,
  getPaymentPlanSettings,
} from "@/lib/payment-settings-data";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";
import {
  paymentPlanSettingsUpdateSchema,
  type PaymentPlanSettingsUpdateInput,
} from "@/lib/validations/payment";

export { getPaymentPlanSettings, getPaymentPlanSettingByBillingType };

type ActionResult = {
  success: boolean;
  error?: string;
};

type WebhookTestResult = {
  success: boolean;
  error?: string;
  results?: Array<{
    url: string;
    ok: boolean;
    status?: number;
    message?: string;
  }>;
};

async function assertAdmin(): Promise<ActionResult | null> {
  const admin = await getCurrentAdmin();

  if (!admin || !isAdmin(admin)) {
    return { success: false, error: "Acesso não autorizado." };
  }

  return null;
}

export async function updatePaymentPlanSetting(
  id: string,
  data: PaymentPlanSettingsUpdateInput,
): Promise<ActionResult> {
  const authError = await assertAdmin();

  if (authError) {
    return authError;
  }

  const parsed = paymentPlanSettingsUpdateSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { error } = await supabase
    .from("payment_plan_settings")
    .update({
      redirect_url: parsed.data.redirect_url ?? null,
      webhook_1_url: parsed.data.webhook_1_url ?? null,
      webhook_2_url: parsed.data.webhook_2_url ?? null,
      show_coupon_field: parsed.data.show_coupon_field,
      default_coupon: parsed.data.default_coupon ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/pagamentos");
  revalidatePath("/pay/month");
  revalidatePath("/pay/year");

  return { success: true };
}

async function postSafeWebhook(url: string, payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      message: response.ok
        ? "Webhook entregue com sucesso."
        : `Resposta HTTP ${response.status}.`,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        message: "Timeout ao chamar webhook.",
      };
    }

    return {
      ok: false,
      message: "Falha ao chamar webhook.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function testPaymentWebhook(
  planId: string,
): Promise<WebhookTestResult> {
  const authError = await assertAdmin();

  if (authError) {
    return authError;
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase não configurado." };
  }

  const { data: plan, error } = await supabase
    .from("payment_plan_settings")
    .select(
      "id, billing_type, price_id, webhook_1_url, webhook_2_url, default_coupon",
    )
    .eq("id", planId)
    .maybeSingle();

  if (error || !plan) {
    return { success: false, error: "Plano não encontrado." };
  }

  const urls = [plan.webhook_1_url, plan.webhook_2_url].filter(
    (value): value is string => Boolean(value),
  );

  if (urls.length === 0) {
    return {
      success: false,
      error: "Nenhum webhook configurado para este plano.",
    };
  }

  // Webhooks nunca recebem dados de cartão.
  const safePayload = {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 305 555 1234",
    billingType: plan.billing_type,
    priceId: plan.price_id,
    coupon: plan.default_coupon ?? null,
    test: true,
  };

  const results = await Promise.all(
    urls.map(async (url) => ({
      url,
      ...(await postSafeWebhook(url, safePayload)),
    })),
  );

  const allOk = results.every((result) => result.ok);

  return {
    success: allOk,
    error: allOk ? undefined : "Um ou mais webhooks falharam.",
    results,
  };
}
