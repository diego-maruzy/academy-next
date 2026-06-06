import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().nullable().optional(),
);

export const clientSchema = z.object({
  full_name: z.string().min(2, "Informe o nome completo."),
  email: z.string().email("Informe um email válido."),
  phone: optionalText,
  role: z.string().min(1, "Informe a role."),
  status: z.enum(["active", "pending", "inactive", "blocked"], {
    message: "Informe um status válido.",
  }),
  source: optionalText,
  program_id: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.string().uuid("Programa inválido.").nullable().optional(),
  ),
  notes: optionalText,
});

export type ClientInput = z.infer<typeof clientSchema>;
