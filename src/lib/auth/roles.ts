export type UserRole = "client" | "team" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  client: "Cliente",
  team: "Equipe",
  admin: "Administrador",
};
