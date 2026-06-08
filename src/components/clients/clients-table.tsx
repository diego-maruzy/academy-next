"use client";

import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { ClientActionsMenu } from "@/components/clients/client-actions-menu";
import { ClientPlanBadge } from "@/components/clients/client-plan-badge";
import { StatusBadge } from "@/components/crm/status-badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/components/ui/admin-modal";
import type { Client } from "./types";

type ClientsTableProps = {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
};

export function ClientsTable({
  clients,
  onView,
  onEdit,
  onDelete,
}: ClientsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              <Th>Cliente</Th>
              <Th>Plano</Th>
              <Th>Status</Th>
              <Th>Telefone</Th>
              <Th>Cadastro</Th>
              <Th>Último acesso</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-b border-white/[0.06] transition hover:bg-white/[0.03]"
              >
                <Td>
                  <div className="flex min-w-[220px] items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-400/10 text-xs font-semibold text-blue-200">
                      {getInitials(client.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white">{client.fullName}</p>
                      <p className="mt-0.5 break-all text-xs text-slate-400">
                        {client.email}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <ClientPlanBadge
                    label={client.planLabel}
                    isPremium={client.isPremium}
                  />
                </Td>
                <Td>
                  <StatusBadge
                    status={client.status}
                    label={client.statusLabel}
                  />
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-slate-300">
                    {client.phone}
                  </span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-slate-300">
                    {client.createdAt}
                  </span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-slate-300">
                    {client.lastSignInAt}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => onView(client)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Ver
                    </Button>
                    <ClientActionsMenu
                      onEdit={() => onEdit(client)}
                      onDelete={() => onDelete(client)}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className ?? ""}`}>{children}</td>;
}
