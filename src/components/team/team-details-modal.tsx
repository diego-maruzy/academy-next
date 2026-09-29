"use client";

import {
  CalendarDays,
  Clock3,
  Edit3,
  Mail,
  Phone,
  Shield,
  Trash2,
  UserCog,
} from "lucide-react";
import { RoleBadge } from "@/components/crm/role-badge";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import {
  AdminContactPill,
  AdminDetailCard,
  AdminModal,
  AdminModalBody,
  AdminModalCloseButton,
  AdminModalFooter,
  AdminModalHero,
  getInitials,
} from "@/components/ui/admin-modal";
import type { TeamMember } from "./types";

type TeamDetailsModalProps = {
  member: TeamMember | null;
  onClose: () => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
};

export function TeamDetailsModal({
  member,
  onClose,
  onEdit,
  onDelete,
}: TeamDetailsModalProps) {
  if (!member) {
    return null;
  }

  return (
    <AdminModal open labelledBy="admin-modal-title" onClose={onClose} size="xl">
      <AdminModalCloseButton onClose={onClose} label="Fechar ficha do membro" />

      <AdminModalHero
        title={member.fullName}
        subtitle="Ficha da equipe"
        initials={getInitials(member.fullName)}
        accent="violet"
        badges={
          <>
            <StatusBadge status={member.status} label={member.statusLabel} />
            <RoleBadge
              value={member.permission}
              label={member.permissionLabel}
              variant="permission"
            />
          </>
        }
        meta={
          <>
            <AdminContactPill icon={Mail} label="Email" value={member.email} />
            <AdminContactPill
              icon={Phone}
              label="Telefone"
              value={member.phone}
            />
          </>
        }
      />

      <AdminModalBody>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminDetailCard
            icon={UserCog}
            label="Nome completo"
            value={member.fullName}
          />
          <AdminDetailCard icon={Mail} label="Email" value={member.email} />
          <AdminDetailCard icon={Phone} label="Telefone" value={member.phone} />
          <AdminDetailCard
            icon={Shield}
            label="Permissão"
            value={member.permissionLabel}
          />
          <AdminDetailCard
            icon={CalendarDays}
            label="Data de cadastro"
            value={member.createdAt}
          />
          <AdminDetailCard
            icon={Clock3}
            label="Última atualização"
            value={member.updatedAt}
            className="md:col-span-2 xl:col-span-1"
          />
        </div>
      </AdminModalBody>

      <AdminModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Fechar
        </Button>
        <Button type="button" variant="secondary" onClick={() => onEdit(member)}>
          <Edit3 className="mr-2 h-4 w-4" />
          Editar membro
        </Button>
        <Button type="button" variant="danger" onClick={() => onDelete(member)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir membro
        </Button>
      </AdminModalFooter>
    </AdminModal>
  );
}
