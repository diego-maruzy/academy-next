"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus, UserCog } from "lucide-react";
import { TeamDetailsModal } from "@/components/team/team-details-modal";
import { TeamFormModal } from "@/components/team/team-form-modal";
import type { TeamMember } from "@/components/team/types";
import { CardsEmptyState, CardsGrid } from "@/components/crm/cards-grid";
import { EntityFiltersToolbar } from "@/components/crm/entity-filters-toolbar";
import { TeamMemberCard } from "@/components/crm/team-member-card";
import { Button } from "@/components/ui/button";
import { TEAM_STATUS_LABELS } from "@/lib/admin-labels";
import {
  createTeamMember,
  deleteTeamMember,
  updateTeamMember,
} from "@/lib/actions/team-actions";
import type { TeamMemberInput } from "@/lib/validations/team";

type TeamPageContentProps = {
  initialMembers: TeamMember[];
};

export function TeamPageContent({ initialMembers }: TeamPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchValue = searchParams.get("q") ?? "";
  const [statusFilter, setStatusFilter] = useState("all");
  const [permissionFilter, setPermissionFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  const permissionOptions = useMemo(() => {
    const permissions = [
      ...new Set(initialMembers.map((member) => member.permission)),
    ].sort();

    return [
      { value: "all", label: "Todas as permissões" },
      ...permissions.map((permission) => ({
        value: permission,
        label: permission,
      })),
    ];
  }, [initialMembers]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Todos os status" },
      ...Object.entries(TEAM_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    [],
  );

  function updateSearchQuery(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }

    const query = params.toString();
    router.replace(query ? `/equipe?${query}` : "/equipe");
  }

  const visibleMembers = useMemo(() => {
    const searchQuery = searchValue.trim().toLowerCase();

    return initialMembers.filter((member) => {
      if (statusFilter !== "all" && member.status !== statusFilter) {
        return false;
      }

      if (permissionFilter !== "all" && member.permission !== permissionFilter) {
        return false;
      }

      if (!searchQuery) {
        return true;
      }

      return (
        member.fullName.toLowerCase().includes(searchQuery) ||
        member.email.toLowerCase().includes(searchQuery) ||
        member.roleLabel.toLowerCase().includes(searchQuery) ||
        member.department.toLowerCase().includes(searchQuery)
      );
    });
  }, [initialMembers, searchValue, statusFilter, permissionFilter]);

  function openCreateForm() {
    setEditingMember(null);
    setFormOpen(true);
  }

  function openEditForm(member: TeamMember) {
    setSelectedMember(null);
    setEditingMember(member);
    setFormOpen(true);
  }

  async function saveMember(values: TeamMemberInput, memberId?: string) {
    const result = memberId
      ? await updateTeamMember(memberId, values)
      : await createTeamMember(values);

    if (!result.success) {
      return result.error ?? "Não foi possível salvar o membro.";
    }

    setFormOpen(false);
    setEditingMember(null);
    router.refresh();
    return null;
  }

  function deleteMemberItem(member: TeamMember) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este membro da equipe? Esta ação não pode ser desfeita.",
    );

    if (!confirmed) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteTeamMember(member.id);

      if (!result.success) {
        window.alert(result.error ?? "Não foi possível excluir o membro.");
        return;
      }

      setSelectedMember(null);
      setEditingMember(null);
      setFormOpen(false);
      router.refresh();
    });
  }

  const countLabel =
    visibleMembers.length === 1
      ? "1 membro"
      : `${visibleMembers.length} membros`;

  return (
    <div className="grid gap-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300">
            Operação
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Equipe
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Gerencie membros responsáveis pela operação da Academy.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Novo membro
        </Button>
      </section>

      <EntityFiltersToolbar
        searchValue={searchValue}
        onSearchChange={updateSearchQuery}
        searchPlaceholder="Buscar por nome, e-mail ou função..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={statusOptions}
        secondaryValue={permissionFilter}
        onSecondaryChange={setPermissionFilter}
        secondaryLabel="Permissão"
        secondaryOptions={permissionOptions}
        countLabel={countLabel}
      />

      {initialMembers.length === 0 ? (
        <CardsEmptyState
          icon={UserCog}
          title="Nenhum membro cadastrado ainda."
          description="Adicione membros da equipe responsáveis pela operação da Academy."
          actionLabel="Criar membro"
          onAction={openCreateForm}
        />
      ) : visibleMembers.length === 0 ? (
        <CardsEmptyState
          icon={UserCog}
          title="Nenhum membro encontrado."
          description="Ajuste os filtros ou limpe a busca para ver todos os registros."
          actionLabel="Limpar busca"
          onAction={() => {
            setStatusFilter("all");
            setPermissionFilter("all");
            router.replace("/equipe");
          }}
        />
      ) : (
        <CardsGrid>
          {visibleMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onView={setSelectedMember}
              onEdit={openEditForm}
              onDelete={deleteMemberItem}
            />
          ))}
        </CardsGrid>
      )}

      <TeamDetailsModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onEdit={openEditForm}
        onDelete={deleteMemberItem}
      />

      <TeamFormModal
        key={editingMember?.id ?? "new"}
        open={formOpen}
        member={editingMember}
        onClose={() => {
          setFormOpen(false);
          setEditingMember(null);
        }}
        onSave={saveMember}
      />

      {deletePending ? (
        <p className="sr-only" aria-live="polite">
          Excluindo membro...
        </p>
      ) : null}
    </div>
  );
}
