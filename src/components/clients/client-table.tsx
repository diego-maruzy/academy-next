"use client";

import { Edit3, Eye, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Client } from "./types";

type ClientTableProps = {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onCreate: () => void;
};

function statusClass(status: Client["status"]) {
  if (status === "active") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-red-400/20 bg-red-400/10 text-red-300";
}

export function ClientTable({
  clients,
  onView,
  onEdit,
  onDelete,
  onCreate,
}: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-lg font-semibold text-white">Nenhum cliente cadastrado</p>
          <p className="max-w-md text-sm text-slate-400">
            Crie o primeiro cliente manualmente ou receba leads via webhook de
            conexões.
          </p>
          <Button type="button" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Criar cliente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Nome</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Telefone</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Origem</th>
                <th className="px-6 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => onView(client)}
                  className="cursor-pointer text-slate-300 transition hover:bg-white/[0.03]"
                >
                  <td className="px-6 py-5 font-medium text-white">
                    {client.fullName}
                  </td>
                  <td className="px-6 py-5">{client.email}</td>
                  <td className="px-6 py-5">{client.phone}</td>
                  <td className="px-6 py-5">{client.role}</td>
                  <td className="px-6 py-5">
                    <Badge className={cn(statusClass(client.status))}>
                      {client.statusLabel}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">{client.source}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          onView(client);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver ficha
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(client);
                        }}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(client);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
