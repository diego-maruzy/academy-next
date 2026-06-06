import { z } from "zod";

export const emailTemplateUpdateSchema = z.object({
  enabled: z.boolean(),
  subject: z.string().min(1, "Informe o assunto."),
  html_body: z.string().min(1, "Informe o corpo HTML."),
  team_recipients: z
    .array(z.string().email("Informe um e-mail válido."))
    .max(20, "Máximo de 20 destinatários.")
    .optional(),
});

export type EmailTemplateUpdateInput = z.infer<typeof emailTemplateUpdateSchema>;

export const sendTestEmailSchema = z.object({
  billingType: z.enum(["PREMIUM_MONTH", "PREMIUM_YEAR"]),
  templateType: z.enum(["customer", "team"]),
  recipient: z.string().email("Informe um e-mail válido para o teste."),
});

export type SendTestEmailInput = z.infer<typeof sendTestEmailSchema>;
