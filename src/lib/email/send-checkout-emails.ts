/**
 * E-mails pós-checkout — nunca incluir dados de cartão.
 */

import { renderTemplate } from "@/lib/email/email-template-renderer";
import { getEmailTemplatesByBillingType } from "@/lib/email/email-template-data";
import { sendEmail } from "@/lib/email/email-service";
import { getPaymentPlanSettingByBillingType } from "@/lib/payment-settings-data";

export type CheckoutEmailPayload = {
  billingType: "PREMIUM_MONTH" | "PREMIUM_YEAR";
  name: string;
  email: string;
  phone: string;
  coupon?: string | null;
};

function buildVariables(
  payload: CheckoutEmailPayload,
  planName: string,
  planLabel: string,
  price: string,
) {
  return {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    plan: planName,
    planLabel,
    price,
    coupon: payload.coupon?.trim() ?? "",
  };
}

export async function sendCheckoutApprovedEmails(
  payload: CheckoutEmailPayload,
): Promise<void> {
  try {
    const [templates, plan] = await Promise.all([
      getEmailTemplatesByBillingType(payload.billingType),
      getPaymentPlanSettingByBillingType(payload.billingType),
    ]);

    if (!plan || templates.length === 0) {
      return;
    }

    const variables = buildVariables(
      payload,
      plan.plan_name,
      plan.plan_name,
      plan.price_label,
    );

    const customerTemplate = templates.find((t) => t.template_type === "customer");
    const teamTemplate = templates.find((t) => t.template_type === "team");

    if (customerTemplate?.enabled) {
      const subject = renderTemplate(customerTemplate.subject, variables);
      const html = renderTemplate(customerTemplate.html_body, variables);

      await sendEmail({
        to: payload.email,
        subject,
        html,
        billingType: payload.billingType,
        templateType: "customer",
        metadata: {
          source: "checkout",
          name: payload.name,
          email: payload.email,
        },
      });
    }

    if (teamTemplate?.enabled && teamTemplate.team_recipients.length > 0) {
      const subject = renderTemplate(teamTemplate.subject, variables);
      const html = renderTemplate(teamTemplate.html_body, variables);

      await Promise.allSettled(
        teamTemplate.team_recipients.map((recipient) =>
          sendEmail({
            to: recipient,
            subject,
            html,
            billingType: payload.billingType,
            templateType: "team",
            metadata: {
              source: "checkout",
              name: payload.name,
              email: payload.email,
            },
          }),
        ),
      );
    }
  } catch (error) {
    console.error(
      "[checkout-email] Falha ao enviar e-mails pós-pagamento:",
      error instanceof Error ? error.message : error,
    );
  }
}

export function getTestEmailVariables(billingType: "PREMIUM_MONTH" | "PREMIUM_YEAR") {
  if (billingType === "PREMIUM_YEAR") {
    return {
      name: "Teste Checkmate",
      email: "teste@checkmateproperty.com",
      phone: "+1 305 555 1234",
      plan: "Annual",
      planLabel: "Plano Anual",
      price: "$961.00/ano",
      coupon: "FLIP10",
    };
  }

  return {
    name: "Teste Checkmate",
    email: "teste@checkmateproperty.com",
    phone: "+1 305 555 1234",
    plan: "Monthly",
    planLabel: "Plano Mensal",
    price: "$89.00/mês",
    coupon: "FLIP10",
  };
}
