import type { TeamMemberRow } from "@/lib/team-data";
import {
  TEAM_STATUS_LABELS,
  formatDate,
  formatDateTime,
  type TeamStatus,
} from "@/lib/admin-labels";
import { formatTeamUserRole, normalizeTeamUserRole } from "@/lib/team/team-roles";
import { formatUsPhoneDisplay } from "@/lib/phone-us";
import type { TeamMemberInput } from "@/lib/validations/team";

export type TeamMember = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  phoneRaw: string;
  permission: string;
  permissionLabel: string;
  status: TeamStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type TeamFormValues = TeamMemberInput;

export function mapTeamMemberRow(row: TeamMemberRow): TeamMember {
  const status = row.status as TeamStatus;
  const permission = normalizeTeamUserRole(row.permission);

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: formatUsPhoneDisplay(row.phone),
    phoneRaw: row.phone ?? "",
    permission,
    permissionLabel: formatTeamUserRole(permission),
    status,
    statusLabel: TEAM_STATUS_LABELS[status] ?? row.status,
    createdAt: formatDate(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
  };
}

export function mapTeamMemberToInput(member: TeamMember): TeamMemberInput {
  return {
    full_name: member.fullName,
    email: member.email,
    phone: member.phoneRaw || null,
    permission: normalizeTeamUserRole(member.permission),
    status: member.status,
  };
}
