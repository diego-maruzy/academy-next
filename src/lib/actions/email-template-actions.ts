"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { isAdmin } from "@/lib/admin-auth/permissions";
import {
  getEmailSendLogs,
  getEmailTemplates,
} from "@/lib/email/email-template-data";
import { renderTemplate } from "@/lib/email/email-template-renderer";
import { sendEmail } from "@/lib/email/email-service";
import { getTestEmailVariables } from "@/lib/email/send-checkout-emails";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";
import {
  emailTemplateUpdateSchema,
  sendTestEmailSchema,
  type EmailTemplateUpdateInput,
  type SendTestEmailInput,
} from "@/lib/validations/email";

export { getEmailTemplates, getEmailSendLogs };

type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  status?: "sent" | "failed" | "stub";
};

async function assertAdmin(): Promise<ActionResult | null> {
  const admin = await getCurrentAdmin();

  if (!admin || !isAdmin(admin)) {
    return { success: false, error: "Acesso não autorizado." };
  }

  return null;
}

export async function updateEmailTemplate(
  id: string,
  data: EmailTemplateUpdateInput,
): Promise<ActionResult> {
  const authError = await assertAdmin();

  if (authError) {
    return authError;
  }

  const parsed = emailTemplateUpdateSchema.safeParse(data);

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

  const { data: existing, error: fetchError } = await supabase
    .from("email_templates")
    .select("template_type")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: "Template não encontrado." };
  }

  const teamRecipients =
    existing.template_type === "team"
      ? Array.from(
          new Set(
            (parsed.data.team_recipients ?? []).map((email) =>
              email.trim().toLowerCase(),
            ),
          ),
        )
      : [];

  const { error } = await supabase
    .from("email_templates")
    .update({
      enabled: parsed.data.enabled,
      subject: parsed.data.subject.trim(),
      html_body: parsed.data.html_body,
      team_recipients: teamRecipients,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/emails");

  return { success: true };
}

export async function sendTestEmailAction(
  input: SendTestEmailInput,
): Promise<ActionResult> {
  const authError = await assertAdmin();

  if (authError) {
    return authError;
  }

  const parsed = sendTestEmailSchema.safeParse(input);

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

  const { data: template, error } = await supabase
    .from("email_templates")
    .select("id, billing_type, template_type, subject, html_body, enabled")
    .eq("billing_type", parsed.data.billingType)
    .eq("template_type", parsed.data.templateType)
    .maybeSingle();

  if (error || !template) {
    return { success: false, error: "Template não encontrado." };
  }

  const variables = getTestEmailVariables(parsed.data.billingType);
  const subject = renderTemplate(template.subject, variables);
  const html = renderTemplate(template.html_body, variables);

  const result = await sendEmail({
    to: parsed.data.recipient,
    subject,
    html,
    billingType: parsed.data.billingType,
    templateType: parsed.data.templateType,
    metadata: {
      source: "admin_test",
      test: true,
    },
  });

  revalidatePath("/admin/emails");

  if (result.status === "stub") {
    return {
      success: true,
      status: "stub",
      message:
        "Teste registrado em modo stub. Configure RESEND_API_KEY para envio real.",
    };
  }

  if (result.status === "failed") {
    return {
      success: false,
      status: "failed",
      error: result.errorMessage ?? "Falha ao enviar e-mail de teste.",
    };
  }

  return {
    success: true,
    status: "sent",
    message: "E-mail de teste enviado com sucesso.",
  };
}
