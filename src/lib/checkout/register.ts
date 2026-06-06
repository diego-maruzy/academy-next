/**
 * Esta integração envia cartão para API própria e aumenta escopo PCI.
 * Recomendado migrar para Stripe Checkout ou Stripe Payment Element.
 * Não armazenar cartão no localStorage ou sessionStorage.
 * Não registrar número do cartão nem CVC em logs.
 */

import { getPaymentPlanSettingByBillingType } from "@/lib/payment-settings-data";
import {
  checkoutFormSchema,
  checkoutPayloadSchema,
  type CheckoutFormInput,
} from "@/lib/validations/payment";

export type CheckoutRegisterResult = {
  success: boolean;
  status?: number;
  errorCode?: string;
  message: string;
  data?: Record<string, unknown>;
};

function getCheckoutTimeoutMs() {
  const raw = process.env.CHECKOUT_API_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : 30_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30_000;
}

function normalizeCardNumber(number: string) {
  return number.replace(/\s+/g, "");
}

function buildCoupon(
  userCoupon: string | null | undefined,
  defaultCoupon: string | null,
) {
  const trimmed = userCoupon?.trim();
  if (trimmed) {
    return trimmed;
  }

  return defaultCoupon?.trim() || undefined;
}

async function fireSafeWebhooks(
  urls: Array<string | null>,
  payload: Record<string, unknown>,
) {
  const targets = urls.filter((url): url is string => Boolean(url));

  await Promise.allSettled(
    targets.map((url) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    ),
  );
}

function friendlyErrorMessage(status: number, body: unknown): string {
  if (status >= 500) {
    return "Erro no servidor. Tente novamente em instantes.";
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const message =
      (typeof record.message === "string" && record.message) ||
      (typeof record.error === "string" && record.error) ||
      (typeof record.detail === "string" && record.detail);

    if (message) {
      return message;
    }
  }

  if (typeof body === "string" && body.trim()) {
    return body;
  }

  return "Não foi possível concluir o pagamento. Verifique os dados e tente novamente.";
}

export async function processCheckoutRegistration(
  input: CheckoutFormInput,
): Promise<CheckoutRegisterResult> {
  const parsedForm = checkoutFormSchema.safeParse(input);

  if (!parsedForm.success) {
    return {
      success: false,
      status: 400,
      errorCode: "VALIDATION_ERROR",
      message: parsedForm.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const plan = await getPaymentPlanSettingByBillingType(
    parsedForm.data.billingType,
  );

  if (!plan) {
    return {
      success: false,
      status: 404,
      errorCode: "PLAN_NOT_FOUND",
      message: "Plano de pagamento não encontrado.",
    };
  }

  const coupon = buildCoupon(
    parsedForm.data.coupon,
    plan.default_coupon,
  );

  const payload = {
    name: parsedForm.data.name.trim(),
    email: parsedForm.data.email.trim(),
    phone: parsedForm.data.phone.trim(),
    password: plan.default_password || "fliphouse2026",
    card: {
      ...parsedForm.data.card,
      number: normalizeCardNumber(parsedForm.data.card.number),
      name: parsedForm.data.card.name.trim(),
      address: parsedForm.data.card.address.trim(),
      city: parsedForm.data.card.city.trim(),
      state: parsedForm.data.card.state.trim(),
      zipCode: parsedForm.data.card.zipCode.trim(),
      country: parsedForm.data.card.country.trim(),
    },
    priceId: plan.price_id,
    billingType: plan.billing_type,
    coupon,
  };

  const parsedPayload = checkoutPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      success: false,
      status: 400,
      errorCode: "VALIDATION_ERROR",
      message: parsedPayload.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const controller = new AbortController();
  const timeoutMs = getCheckoutTimeoutMs();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(plan.api_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(parsedPayload.data),
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    let responseBody: unknown = null;

    if (isJson) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }
    } else {
      const text = await response.text();
      responseBody = text || null;
    }

    if (response.ok) {
      if (!isJson && responseBody === null) {
        return {
          success: false,
          status: response.status,
          errorCode: "INVALID_RESPONSE",
          message: "Erro inesperado ao processar pagamento.",
        };
      }

      const safeWebhookPayload = {
        name: parsedPayload.data.name,
        email: parsedPayload.data.email,
        phone: parsedPayload.data.phone,
        billingType: parsedPayload.data.billingType,
        priceId: parsedPayload.data.priceId,
        coupon: parsedPayload.data.coupon ?? null,
      };

      await fireSafeWebhooks(
        [plan.webhook_1_url, plan.webhook_2_url],
        safeWebhookPayload,
      );

      const apiMessage =
        responseBody &&
        typeof responseBody === "object" &&
        typeof (responseBody as Record<string, unknown>).message === "string"
          ? ((responseBody as Record<string, unknown>).message as string)
          : "Conta ativada com sucesso.";

      return {
        success: true,
        status: response.status,
        message: apiMessage,
        data:
          responseBody && typeof responseBody === "object"
            ? (responseBody as Record<string, unknown>)
            : undefined,
      };
    }

    if (!isJson && (responseBody === null || responseBody === "")) {
      return {
        success: false,
        status: response.status,
        errorCode: "INVALID_RESPONSE",
        message: "Erro inesperado ao processar pagamento.",
      };
    }

    const errorCode =
      responseBody &&
      typeof responseBody === "object" &&
      typeof (responseBody as Record<string, unknown>).errorCode === "string"
        ? ((responseBody as Record<string, unknown>).errorCode as string)
        : undefined;

    return {
      success: false,
      status: response.status,
      errorCode,
      message: friendlyErrorMessage(response.status, responseBody),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        status: 408,
        errorCode: "TIMEOUT",
        message: "Tempo de resposta excedido. Tente novamente.",
      };
    }

    return {
      success: false,
      status: 500,
      errorCode: "NETWORK_ERROR",
      message: "Erro no servidor. Tente novamente em instantes.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
