import type { ClientRow } from "@/lib/clients-data";
import { getProgramNameFromClient } from "@/lib/clients-data";
import {
  CLIENT_STATUS_LABELS,
  formatDate,
  formatDateTime,
  type ClientStatus,
} from "@/lib/admin-labels";
import type { ClientPlan } from "@/lib/clients/client-access";
import {
  formatClientSourceLabel,
  getClientSourceKey,
  resolveClientLastSignInAt,
  type ClientSourceKey,
} from "@/lib/clients/client-meta";
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
  plan: ClientPlan;
  planLabel: "Free" | "Premium";
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

export function mapClientRow(row: ClientRow): Client {
  const status = row.status as ClientStatus;
  const lastSignInAtRaw = resolveClientLastSignInAt(row);
  const sourceLabel = formatClientSourceLabel(row.source);

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: formatUsPhoneDisplay(row.whatsapp),
    phoneRaw: row.whatsapp ?? "",
    status,
    statusLabel: CLIENT_STATUS_LABELS[status] ?? row.status,
    programId: row.program_id,
    programName: getProgramNameFromClient(row) ?? "—",
    plan: row.plan,
    planLabel: row.planLabel,
    isPremium: row.isPremium,
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
    plan: client.plan,
    status: client.status,
    source: client.source === "—" ? null : client.source,
    program_id: client.programId,
    notes: client.notes || null,
  };
}
