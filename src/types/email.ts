export type EmailBillingType = "PREMIUM_MONTH" | "PREMIUM_YEAR";
export type EmailTemplateType = "customer" | "team";
export type EmailSendStatus = "sent" | "failed" | "stub";

export type EmailTemplate = {
  id: string;
  billing_type: EmailBillingType;
  template_type: EmailTemplateType;
  enabled: boolean;
  subject: string;
  html_body: string;
  team_recipients: string[];
  created_at: string;
  updated_at: string;
};

export type EmailSendLog = {
  id: string;
  billing_type: string | null;
  template_type: string | null;
  recipient: string;
  subject: string | null;
  status: EmailSendStatus;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export const EMAIL_TEMPLATE_VARIABLES = [
  "{{name}}",
  "{{email}}",
  "{{phone}}",
  "{{plan}}",
  "{{planLabel}}",
  "{{price}}",
  "{{coupon}}",
] as const;
