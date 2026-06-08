/**
 * Não enviar dados de cartão por e-mail.
 * Não logar dados sensíveis.
 * Não expor RESEND_API_KEY nem RESEND_FROM_EMAIL no frontend.
 */

import { getResendClient, getResendFromEmail } from "@/lib/resend";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";
import type { EmailSendStatus } from "@/types/email";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  billingType?: string | null;
  templateType?: string | null;
  metadata?: Record<string, unknown>;
};

export type SendEmailResult = {
  status: EmailSendStatus;
  errorMessage?: string;
};

function getFromAddress() {
  return getResendFromEmail();
}

async function logEmailSend({
  billingType,
  templateType,
  recipient,
  subject,
  status,
  errorMessage,
  metadata,
}: {
  billingType?: string | null;
  templateType?: string | null;
  recipient: string;
  subject: string;
  status: EmailSendStatus;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return;
  }

  await supabase.from("email_send_logs").insert({
    billing_type: billingType ?? null,
    template_type: templateType ?? null,
    recipient,
    subject,
    status,
    error_message: errorMessage ?? null,
    metadata: metadata ?? null,
  });
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  const resend = getResendClient();

  if (!resend) {
    return { status: "stub" };
  }

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: [to],
      subject,
      html,
    });

    if (error) {
      return {
        status: "failed",
        errorMessage: error.message ?? "Falha ao enviar e-mail.",
      };
    }

    return { status: "sent" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao enviar e-mail.";

    return { status: "failed", errorMessage: message };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipient = input.to.trim();
  const subject = input.subject.trim();

  const result = await sendViaResend(recipient, subject, input.html);

  await logEmailSend({
    billingType: input.billingType,
    templateType: input.templateType,
    recipient,
    subject,
    status: result.status,
    errorMessage: result.errorMessage,
    metadata: input.metadata,
  });

  return result;
}
