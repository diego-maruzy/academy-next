import { formatTeamUserRole } from "@/lib/team/team-roles";
import {
  getClientPlanLabel,
  normalizeClientPlan,
  type ClientPlan,
} from "@/lib/clients/client-access";

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
  academy_manager: "Gestor Academy",
  academy_editor: "Editor Academy",
} as const;

export const CLIENT_PLAN_LABELS = {
  free: "Free",
  premium: "Premium",
} as const;

export type ClientStatus = keyof typeof CLIENT_STATUS_LABELS;
export type TeamStatus = keyof typeof TEAM_STATUS_LABELS;

export function formatTeamRole(role: string) {
  return formatTeamUserRole(role);
}

export function formatClientPlan(plan: ClientPlan | string | null | undefined) {
  return getClientPlanLabel(normalizeClientPlan(plan));
}

export function normalizeAdminClientPlan(
  plan: ClientPlan | string | null | undefined,
): ClientPlan {
  return normalizeClientPlan(plan);
}