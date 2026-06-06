import { createSupabaseServiceServerClient } from "@/lib/supabase/server";
import type { EmailSendLog, EmailTemplate } from "@/types/email";

const templateColumns =
  "id, billing_type, template_type, enabled, subject, html_body, team_recipients, created_at, updated_at";

const logColumns =
  "id, billing_type, template_type, recipient, subject, status, error_message, metadata, created_at";

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("email_templates")
    .select(templateColumns)
    .order("billing_type", { ascending: true })
    .order("template_type", { ascending: true });

  if (error) {
    console.error("[email-templates] Erro ao buscar templates:", error.message);
    return [];
  }

  return (data ?? []) as EmailTemplate[];
}

export async function getEmailTemplatesByBillingType(
  billingType: string,
): Promise<EmailTemplate[]> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("email_templates")
    .select(templateColumns)
    .eq("billing_type", billingType);

  if (error) {
    console.error("[email-templates] Erro ao buscar templates:", error.message);
    return [];
  }

  return (data ?? []) as EmailTemplate[];
}

export async function getEmailSendLogs(limit = 50): Promise<EmailSendLog[]> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("email_send_logs")
    .select(logColumns)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[email-templates] Erro ao buscar logs:", error.message);
    return [];
  }

  return (data ?? []) as EmailSendLog[];
}
