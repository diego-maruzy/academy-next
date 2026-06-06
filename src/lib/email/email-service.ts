/**
 * Não enviar dados de cartão por e-mail.
 * Não logar dados sensíveis.
 * Não expor RESEND_API_KEY nem CHECKMATE_EMAIL_FROM no frontend.
 */

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

const DEFAULT_FROM = "onboarding@resend.dev";

function getFromAddress() {
  return process.env.CHECKMATE_EMAIL_FROM?.trim() || DEFAULT_FROM;
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
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return { status: "stub" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      let message = `Resend HTTP ${response.status}`;

      try {
        const body = (await response.json()) as { message?: string };
        if (body.message) {
          message = body.message;
        }
      } catch {
        // ignore parse errors
      }

      return { status: "failed", errorMessage: message };
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
