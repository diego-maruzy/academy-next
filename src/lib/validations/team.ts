import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().nullable().optional(),
);

const optionalPassword = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z
    .string()
    .min(8, "A senha administrativa deve ter pelo menos 8 caracteres.")
    .optional(),
);

export const teamMemberSchema = z.object({
  full_name: z.string().min(2, "Informe o nome completo."),
  email: z.string().email("Informe um email válido."),
  phone: optionalText,
  role: z.string().min(1, "Informe a função."),
  permission: z.string().min(1, "Informe a permissão."),
  department: optionalText,
  status: z.enum(["active", "invited", "inactive", "blocked"], {
    message: "Informe um status válido.",
  }),
  notes: optionalText,
  password: optionalPassword,
  newPassword: optionalPassword,
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
