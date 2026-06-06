/**
 * Proxy de checkout — evita CORS e mantém configuração no servidor.
 * Esta integração encaminha dados de cartão para API externa (escopo PCI).
 * Recomendado migrar para Stripe Checkout ou Stripe Payment Element.
 * Não registrar número do cartão nem CVC em logs.
 */

import { processCheckoutRegistration } from "@/lib/checkout/register";
import type { CheckoutFormInput } from "@/lib/validations/payment";

export async function POST(request: Request) {
  let body: CheckoutFormInput;

  try {
    body = (await request.json()) as CheckoutFormInput;
  } catch {
    return Response.json(
      {
        success: false,
        errorCode: "INVALID_JSON",
        message: "Corpo da requisição inválido.",
      },
      { status: 400 },
    );
  }

  const result = await processCheckoutRegistration(body);

  return Response.json(
    {
      success: result.success,
      errorCode: result.errorCode,
      message: result.message,
      data: result.data,
    },
    { status: result.success ? 200 : (result.status ?? 500) },
  );
}
