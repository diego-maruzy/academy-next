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
import type { Client } from "@/components/clients/types";

type ClientCardProps = {
  client: Client;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
};

export function ClientCard({
  client,
  onView,
  onEdit,
  onDelete,
}: ClientCardProps) {
  return (
    <EntityCardShell
      initials={getInitials(client.fullName)}
      title={client.fullName}
      subtitle={client.email}
      accent="blue"
      onClick={() => onView(client)}
      headerBadges={
        <>
          <StatusBadge status={client.status} label={client.statusLabel} />
          <RoleBadge value={client.role} variant="client" />
        </>
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="h-10 flex-1"
            onClick={() => onView(client)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver ficha
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 flex-1"
            onClick={() => onEdit(client)}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            type="button"
            variant="danger"
            className="h-10 flex-1"
            onClick={() => onDelete(client)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <EntityCardField label="Telefone" value={client.phone} />
        <EntityCardField label="Programa" value={client.programName} />
        <EntityCardField label="Origem" value={client.source} />
        <EntityCardField label="Cadastro" value={client.createdAt} />
      </div>
      {client.notes ? (
        <EntityCardField
          label="Observações"
          value={client.notes}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        />
      ) : null}
    </EntityCardShell>
  );
}
