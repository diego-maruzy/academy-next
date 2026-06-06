"use client";

import { Edit3, Eye, Trash2 } from "lucide-react";
import {
  EntityCardField,
  EntityCardShell,
} from "@/components/crm/entity-card-shell";
import { RoleBadge } from "@/components/crm/role-badge";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/components/ui/admin-modal";
import type { TeamMember } from "@/components/team/types";

type TeamMemberCardProps = {
  member: TeamMember;
  onView: (member: TeamMember) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
};

export function TeamMemberCard({
  member,
  onView,
  onEdit,
  onDelete,
}: TeamMemberCardProps) {
  return (
    <EntityCardShell
      initials={getInitials(member.fullName)}
      title={member.fullName}
      subtitle={member.email}
      accent="violet"
      onClick={() => onView(member)}
      headerBadges={
        <>
          <StatusBadge status={member.status} label={member.statusLabel} />
          <RoleBadge
            value={member.permission}
            variant="permission"
          />
        </>
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="h-10 flex-1"
            onClick={() => onView(member)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver ficha
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 flex-1"
            onClick={() => onEdit(member)}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            type="button"
            variant="danger"
            className="h-10 flex-1"
            onClick={() => onDelete(member)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <EntityCardField label="Função" value={member.roleLabel} />
        <EntityCardField label="Permissão" value={member.permission} />
        <EntityCardField label="Departamento" value={member.department} />
        <EntityCardField label="Telefone" value={member.phone} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RoleBadge
          value={member.role}
          label={member.roleLabel}
          variant="team-role"
        />
        <span className="text-xs text-slate-500">
          Atualizado em {member.updatedAt}
        </span>
      </div>
    </EntityCardShell>
  );
}
