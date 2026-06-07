import type { ClientRow } from "@/lib/clients-data";
import { getProgramNameFromClient } from "@/lib/clients-data";
import {
  CLIENT_STATUS_LABELS,
  formatDate,
  formatDateTime,
  type ClientStatus,
} from "@/lib/admin-labels";
import {
  formatClientSourceLabel,
  getClientSourceKey,
  isPremiumClient,
  resolveClientLastSignInAt,
  resolveClientPlanId,
  type ClientSourceKey,
} from "@/lib/clients/client-meta";
import { getPlanLabel } from "@/lib/clients/client-plan-mapper";
import { formatClientRole } from "@/lib/clients/client-role-formatter";
import { formatUsPhoneDisplay } from "@/lib/phone-us";
import type { ClientInput } from "@/lib/validations/client";

export type Client = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  phoneRaw: string;
  status: ClientStatus;
  statusLabel: string;
  programId: string | null;
  programName: string;
  role: string;
  roleLabel: string;
  planId: string | null;
  planLabel: string;
  isPremium: boolean;
  source: string;
  sourceKey: Exclude<ClientSourceKey, "all">;
  sourceLabel: string;
  createdAt: string;
  createdAtRaw: string;
  updatedAt: string;
  lastSignInAt: string;
  lastSignInAtRaw: string | null;
  notes: string;
};

export type ClientFormValues = ClientInput;

function resolvePlanDisplayLabel(
  role: string,
  planId: string | null,
  premium: boolean,
): string {
  if (premium) {
    return "Premium";
  }

  if (planId) {
    const mapped = getPlanLabel(planId);
    if (mapped !== "Plano não identificado") {
      return mapped;
    }
  }

  const roleLabel = formatClientRole(role);
  if (roleLabel === "Free" || roleLabel === "Premium") {
    return roleLabel;
  }

  return planId ? getPlanLabel(planId) : "Free";
}

export function mapClientRow(row: ClientRow): Client {
  const status = row.status as ClientStatus;
  const planId = resolveClientPlanId(row);
  const premium = isPremiumClient(row.role, planId);
  const lastSignInAtRaw = resolveClientLastSignInAt(row);
  const sourceLabel = formatClientSourceLabel(row.source);

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: formatUsPhoneDisplay(row.phone),
    phoneRaw: row.phone ?? "",
    status,
    statusLabel: CLIENT_STATUS_LABELS[status] ?? row.status,
    programId: row.program_id,
    programName: getProgramNameFromClient(row) ?? "—",
    role: row.role,
    roleLabel: formatClientRole(row.role),
    planId,
    planLabel: resolvePlanDisplayLabel(row.role, planId, premium),
    isPremium: premium,
    source: row.source ?? "—",
    sourceKey: getClientSourceKey(row.source),
    sourceLabel,
    createdAt: formatDate(row.created_at),
    createdAtRaw: row.created_at,
    updatedAt: formatDateTime(row.updated_at),
    lastSignInAt: lastSignInAtRaw
      ? formatDateTime(lastSignInAtRaw)
      : "Nunca acessou",
    lastSignInAtRaw,
    notes: row.notes ?? "",
  };
}

export function mapClientToInput(client: Client): ClientInput {
  return {
    full_name: client.fullName,
    email: client.email,
    phone: client.phoneRaw || null,
    role: client.role,
    status: client.status,
    source: client.source === "—" ? null : client.source,
    program_id: client.programId,
    notes: client.notes || null,
  };
}
