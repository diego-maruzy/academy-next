"use client";

import {
  BookOpen,
  CalendarDays,
  Clock3,
  Edit3,
  Globe2,
  Mail,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import { ClientAnalyticsPanel } from "@/components/clients/client-analytics-panel";
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
import type { Client } from "./types";

type ClientDetailsModalProps = {
  client: Client | null;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
};

export function ClientDetailsModal({
  client,
  onClose,
  onEdit,
  onDelete,
}: ClientDetailsModalProps) {
  if (!client) {
    return null;
  }

  return (
    <AdminModal open labelledBy="admin-modal-title" onClose={onClose} size="xl">
      <AdminModalCloseButton onClose={onClose} label="Fechar ficha do cliente" />

      <AdminModalHero
        title={client.fullName}
        subtitle="Ficha do cliente"
        initials={getInitials(client.fullName)}
        accent="blue"
        badges={
          <>
            <StatusBadge status={client.status} label={client.statusLabel} />
            <RoleBadge value={client.role} variant="client" />
          </>
        }
        meta={
          <>
            <AdminContactPill icon={Mail} label="Email" value={client.email} />
            <AdminContactPill
              icon={Phone}
              label="Telefone"
              value={client.phone}
            />
          </>
        }
      />

      <AdminModalBody>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminDetailCard
            icon={UserRound}
            label="Nome completo"
            value={client.fullName}
          />
          <AdminDetailCard icon={Mail} label="Email" value={client.email} />
          <AdminDetailCard icon={Phone} label="Telefone" value={client.phone} />
          <AdminDetailCard
            icon={BookOpen}
            label="Programa vinculado"
            value={client.programName}
          />
          <AdminDetailCard
            icon={UserRound}
            label="Role"
            value={client.role}
          />
          <AdminDetailCard icon={Globe2} label="Origem" value={client.source} />
          <AdminDetailCard
            icon={CalendarDays}
            label="Data de cadastro"
            value={client.createdAt}
          />
          <AdminDetailCard
            icon={Clock3}
            label="Última atualização"
            value={client.updatedAt}
            className="md:col-span-2 xl:col-span-2"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Observações
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {client.notes || "Nenhuma observação registrada."}
          </p>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <ClientAnalyticsPanel clientId={client.id} />
        </div>
      </AdminModalBody>

      <AdminModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Fechar
        </Button>
        <Button type="button" variant="secondary" onClick={() => onEdit(client)}>
          <Edit3 className="mr-2 h-4 w-4" />
          Editar cliente
        </Button>
        <Button type="button" variant="danger" onClick={() => onDelete(client)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir cliente
        </Button>
      </AdminModalFooter>
    </AdminModal>
  );
}
