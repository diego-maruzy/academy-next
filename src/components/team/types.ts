import type { TeamMemberRow } from "@/lib/team-data";
import {
  TEAM_STATUS_LABELS,
  formatDate,
  formatDateTime,
  formatTeamRole,
  type TeamStatus,
} from "@/lib/admin-labels";
import { formatUsPhoneDisplay } from "@/lib/phone-us";
import type { TeamMemberInput } from "@/lib/validations/team";

export type TeamMember = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  phoneRaw: string;
  role: string;
  roleLabel: string;
  permission: string;
  status: TeamStatus;
  statusLabel: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
};

export type TeamFormValues = TeamMemberInput;

export function mapTeamMemberRow(row: TeamMemberRow): TeamMember {
  const status = row.status as TeamStatus;

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: formatUsPhoneDisplay(row.phone),
    phoneRaw: row.phone ?? "",
    role: row.role,
    roleLabel: formatTeamRole(row.role),
    permission: row.permission,
    status,
    statusLabel: TEAM_STATUS_LABELS[status] ?? row.status,
    department: row.department ?? "—",
    createdAt: formatDate(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    notes: row.notes ?? "",
  };
}

export function mapTeamMemberToInput(member: TeamMember): TeamMemberInput {
  return {
    full_name: member.fullName,
    email: member.email,
    phone: member.phoneRaw || null,
    role: member.role,
    permission: member.permission,
    department: member.department === "—" ? null : member.department,
    status: member.status,
    notes: member.notes || null,
  };
}
