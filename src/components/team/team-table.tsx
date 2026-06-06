"use client";

import { Edit3, Eye, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./types";

type TeamTableProps = {
  members: TeamMember[];
  onView: (member: TeamMember) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
  onCreate: () => void;
};

function statusClass(status: TeamMember["status"]) {
  if (status === "active") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "invited") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-red-400/20 bg-red-400/10 text-red-300";
}

export function TeamTable({
  members,
  onView,
  onEdit,
  onDelete,
  onCreate,
}: TeamTableProps) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-lg font-semibold text-white">
            Nenhum membro cadastrado
          </p>
          <p className="max-w-md text-sm text-slate-400">
            Adicione membros da equipe responsáveis pela operação da Academy.
          </p>
          <Button type="button" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Criar membro
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Nome</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Telefone</th>
                <th className="px-6 py-4 font-semibold">Função</th>
                <th className="px-6 py-4 font-semibold">Permissão</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {members.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => onView(member)}
                  className="cursor-pointer text-slate-300 transition hover:bg-white/[0.03]"
                >
                  <td className="px-6 py-5 font-medium text-white">
                    {member.fullName}
                  </td>
                  <td className="px-6 py-5">{member.email}</td>
                  <td className="px-6 py-5">{member.phone}</td>
                  <td className="px-6 py-5">{member.roleLabel}</td>
                  <td className="px-6 py-5">{member.permission}</td>
                  <td className="px-6 py-5">
                    <Badge className={cn(statusClass(member.status))}>
                      {member.statusLabel}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          onView(member);
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
                          onEdit(member);
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
                          onDelete(member);
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
