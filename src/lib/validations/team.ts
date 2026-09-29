import { z } from "zod";
import { TEAM_USER_ROLES } from "@/lib/team/team-roles";

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
  permission: z.enum(TEAM_USER_ROLES, {
    message: "Informe uma permissão válida.",
  }),
  status: z.enum(["active", "invited", "inactive", "blocked"], {
    message: "Informe um status válido.",
  }),
  password: optionalPassword,
  newPassword: optionalPassword,
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
