export type ProgramOption = {
  id: string;
  name: string;
};

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

export const CLIENT_STATUS_LABELS = {
  active: "Ativo",
  pending: "Pendente",
  inactive: "Inativo",
  blocked: "Bloqueado",
} as const;

export const TEAM_STATUS_LABELS = {
  active: "Ativo",
  invited: "Convidado",
  inactive: "Inativo",
  blocked: "Bloqueado",
} as const;

export const TEAM_ROLE_LABELS = {
  admin: "Administrador",
  content: "Conteúdo",
  support: "Suporte",
  sales: "Comercial",
  finance: "Financeiro",
} as const;

export const CLIENT_ROLE_LABELS = {
  ROLE_USER: "ROLE_USER",
  ROLE_USER_FREE: "ROLE_USER_FREE",
  academy_access: "academy_access",
  property_access: "property_access",
} as const;

export type ClientStatus = keyof typeof CLIENT_STATUS_LABELS;
export type TeamStatus = keyof typeof TEAM_STATUS_LABELS;

export function formatTeamRole(role: string) {
  return TEAM_ROLE_LABELS[role as keyof typeof TEAM_ROLE_LABELS] ?? role;
}
