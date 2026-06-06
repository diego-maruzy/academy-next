import type { ClientRow } from "@/lib/clients-data";
import { getProgramNameFromClient } from "@/lib/clients-data";
import {
  CLIENT_STATUS_LABELS,
  formatDate,
  formatDateTime,
  type ClientStatus,
} from "@/lib/admin-labels";
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
  source: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
};

export type ClientFormValues = ClientInput;

export function mapClientRow(row: ClientRow): Client {
  const status = row.status as ClientStatus;

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
    source: row.source ?? "—",
    createdAt: formatDate(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
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
