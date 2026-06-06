import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().nullable().optional(),
);

export const incomingWebhookSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  email: z.string().email("Informe um email válido."),
  phone: z.string().optional(),
  password: z.string().optional(),
});

export type IncomingWebhookInput = z.infer<typeof incomingWebhookSchema>;

export const webhookConnectionSchema = z.object({
  name: z.string().min(2, "Informe o nome da conexão."),
  slug: z
    .string()
    .min(2, "Informe o slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use um slug válido."),
  description: optionalText,
  type: z.string().min(1, "Informe o tipo da conexão."),
  role: z.string().min(1, "Informe a role."),
  program_id: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.string().uuid("Programa inválido.").nullable().optional(),
  ),
  status: z.enum(["active", "inactive"], {
    message: "Informe um status válido.",
  }),
  secret_token: optionalText,
});

export type WebhookConnectionInput = z.infer<typeof webhookConnectionSchema>;
