"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus, Users } from "lucide-react";
import { ClientDetailsModal } from "@/components/clients/client-details-modal";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import type { Client } from "@/components/clients/types";
import { CardsEmptyState, CardsGrid } from "@/components/crm/cards-grid";
import { ClientCard } from "@/components/crm/client-card";
import { EntityFiltersToolbar } from "@/components/crm/entity-filters-toolbar";
import { Button } from "@/components/ui/button";
import { CLIENT_STATUS_LABELS } from "@/lib/admin-labels";
import {
  createClient,
  deleteClient,
  updateClient,
} from "@/lib/actions/client-actions";
import type { ClientInput } from "@/lib/validations/client";

type ClientsPageContentProps = {
  initialClients: Client[];
};

export function ClientsPageContent({
  initialClients,
}: ClientsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchValue = searchParams.get("q") ?? "";
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  const roleOptions = useMemo(() => {
    const roles = [...new Set(initialClients.map((client) => client.role))].sort();
    return [
      { value: "all", label: "Todas as roles" },
      ...roles.map((role) => ({ value: role, label: role })),
    ];
  }, [initialClients]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Todos os status" },
      ...Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => ({
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
    router.replace(query ? `/clientes?${query}` : "/clientes");
  }

  const visibleClients = useMemo(() => {
    const searchQuery = searchValue.trim().toLowerCase();

    return initialClients.filter((client) => {
      if (statusFilter !== "all" && client.status !== statusFilter) {
        return false;
      }

      if (roleFilter !== "all" && client.role !== roleFilter) {
        return false;
      }

      if (!searchQuery) {
        return true;
      }

      return (
        client.fullName.toLowerCase().includes(searchQuery) ||
        client.email.toLowerCase().includes(searchQuery) ||
        client.phone?.toLowerCase().includes(searchQuery) ||
        client.programName.toLowerCase().includes(searchQuery)
      );
    });
  }, [initialClients, searchValue, statusFilter, roleFilter]);

  function openCreateForm() {
    setEditingClient(null);
    setFormOpen(true);
  }

  function openEditForm(client: Client) {
    setSelectedClient(null);
    setEditingClient(client);
    setFormOpen(true);
  }

  async function saveClient(values: ClientInput, clientId?: string) {
    const result = clientId
      ? await updateClient(clientId, values)
      : await createClient(values);

    if (!result.success) {
      return result.error ?? "Não foi possível salvar o cliente.";
    }

    setFormOpen(false);
    setEditingClient(null);
    router.refresh();
    return null;
  }

  function deleteClientItem(client: Client) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.",
    );

    if (!confirmed) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteClient(client.id);

      if (!result.success) {
        window.alert(result.error ?? "Não foi possível excluir o cliente.");
        return;
      }

      setSelectedClient(null);
      setEditingClient(null);
      setFormOpen(false);
      router.refresh();
    });
  }

  const countLabel =
    visibleClients.length === 1
      ? "1 cliente"
      : `${visibleClients.length} clientes`;

  return (
    <div className="grid gap-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">
            Relacionamento
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Clientes
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Gerencie alunos, leads e usuários vinculados aos programas da
            Academy.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Novo cliente
        </Button>
      </section>

      <EntityFiltersToolbar
        searchValue={searchValue}
        onSearchChange={updateSearchQuery}
        searchPlaceholder="Buscar por nome, e-mail ou telefone..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={statusOptions}
        secondaryValue={roleFilter}
        onSecondaryChange={setRoleFilter}
        secondaryLabel="Role"
        secondaryOptions={roleOptions}
        countLabel={countLabel}
      />

      {initialClients.length === 0 ? (
        <CardsEmptyState
          icon={Users}
          title="Nenhum cliente cadastrado ainda."
          description="Crie o primeiro cliente manualmente ou receba leads via webhook de conexões."
          actionLabel="Criar cliente"
          onAction={openCreateForm}
        />
      ) : visibleClients.length === 0 ? (
        <CardsEmptyState
          icon={Users}
          title="Nenhum cliente encontrado."
          description="Ajuste os filtros ou limpe a busca para ver todos os registros."
          actionLabel="Limpar busca"
          onAction={() => {
            setStatusFilter("all");
            setRoleFilter("all");
            router.replace("/clientes");
          }}
        />
      ) : (
        <CardsGrid>
          {visibleClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onView={setSelectedClient}
              onEdit={openEditForm}
              onDelete={deleteClientItem}
            />
          ))}
        </CardsGrid>
      )}

      <ClientDetailsModal
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEdit={openEditForm}
        onDelete={deleteClientItem}
      />

      <ClientFormModal
        key={editingClient?.id ?? "new"}
        open={formOpen}
        client={editingClient}
        onClose={() => {
          setFormOpen(false);
          setEditingClient(null);
        }}
        onSave={saveClient}
      />

      {deletePending ? (
        <p className="sr-only" aria-live="polite">
          Excluindo cliente...
        </p>
      ) : null}
    </div>
  );
}
