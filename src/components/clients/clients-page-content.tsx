"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Upload, Users } from "lucide-react";
import { ClientCard } from "@/components/clients/client-card";
import { ClientDetailsModal } from "@/components/clients/client-details-modal";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import {
  ClientImportButton,
  ClientImportModal,
} from "@/components/clients/client-import-modal";
import { ClientStatsCards } from "@/components/clients/client-stats-cards";
import { ClientsTable } from "@/components/clients/clients-table";
import type { Client } from "@/components/clients/types";
import { CardsEmptyState, CardsGrid } from "@/components/crm/cards-grid";
import { Button } from "@/components/ui/button";
import {
  createClient,
  deleteClient,
  updateClient,
} from "@/lib/actions/client-actions";
import {
  filterAndSortClients,
  getClientStats,
  type ClientPlanFilter,
  type ClientSortOption,
  type ClientSourceFilter,
  type ClientStatusFilter,
} from "@/lib/clients/client-filters";
import type { ClientInput } from "@/lib/validations/client";

type ClientsPageContentProps = {
  initialClients: Client[];
  canImport?: boolean;
};

export function ClientsPageContent({
  initialClients,
  canImport = false,
}: ClientsPageContentProps) {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<ClientPlanFilter>("all");
  const [sourceFilter, setSourceFilter] =
    useState<ClientSourceFilter>("all");
  const [sortBy, setSortBy] = useState<ClientSortOption>("recent");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");

    function syncViewMode() {
      setViewMode(mediaQuery.matches ? "cards" : "table");
    }

    syncViewMode();
    mediaQuery.addEventListener("change", syncViewMode);
    return () => mediaQuery.removeEventListener("change", syncViewMode);
  }, []);

  const stats = useMemo(
    () => getClientStats(initialClients),
    [initialClients],
  );

  const visibleClients = useMemo(
    () =>
      filterAndSortClients(initialClients, {
        search: localSearch,
        statusFilter,
        planFilter,
        sourceFilter,
        sortBy,
      }),
    [
      initialClients,
      localSearch,
      statusFilter,
      planFilter,
      sourceFilter,
      sortBy,
    ],
  );

  const countLabel =
    visibleClients.length === 1
      ? "1 cliente encontrado"
      : `${visibleClients.length} clientes encontrados`;

  function openCreateForm() {
    setEditingClient(null);
    setFormOpen(true);
  }

  function openEditForm(client: Client) {
    setSelectedClient(null);
    setEditingClient(client);
    setFormOpen(true);
  }

  function openImport() {
    if (canImport) {
      setImportOpen(true);
      return;
    }

    window.alert("A importação está disponível apenas para administradores.");
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

  function clearFilters() {
    setLocalSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
    setSourceFilter("all");
    setSortBy("recent");
  }

  const showTable = viewMode === "table";

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Gerencie usuários, acessos, planos e histórico da plataforma.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {canImport ? (
            <ClientImportButton onClick={openImport} />
          ) : (
            <Button type="button" variant="secondary" onClick={openImport}>
              <Upload className="mr-2 h-4 w-4" />
              Importar clientes
            </Button>
          )}
          <Button type="button" onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        </div>
      </section>

      <ClientStatsCards stats={stats} />

      <ClientFilters
        search={localSearch}
        onSearchChange={setLocalSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        countLabel={countLabel}
      />

      {initialClients.length === 0 ? (
        <CardsEmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Ajuste os filtros ou importe novos clientes para começar."
          actionLabel="Importar clientes"
          onAction={openImport}
        />
      ) : visibleClients.length === 0 ? (
        <CardsEmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Ajuste os filtros ou importe novos clientes para começar."
          actionLabel="Limpar filtros"
          onAction={clearFilters}
        />
      ) : (
        <>
          {showTable ? (
            <div className="hidden lg:block">
              <ClientsTable
                clients={visibleClients}
                onView={setSelectedClient}
                onEdit={openEditForm}
                onDelete={deleteClientItem}
              />
            </div>
          ) : null}

          <CardsGrid className={showTable ? "lg:hidden" : undefined}>
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
        </>
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

      {canImport ? (
        <ClientImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
        />
      ) : null}

      {deletePending ? (
        <p className="sr-only" aria-live="polite">
          Excluindo cliente...
        </p>
      ) : null}
    </div>
  );
}
