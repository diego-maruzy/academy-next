"use client";

import type { ReactNode } from "react";
import { LayoutGrid, Search, Table2 } from "lucide-react";
import { Input, Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import type {
  ClientPlanFilter,
  ClientSortOption,
  ClientSourceFilter,
  ClientStatusFilter,
} from "@/lib/clients/client-filters";

type ClientFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ClientStatusFilter;
  onStatusFilterChange: (value: ClientStatusFilter) => void;
  planFilter: ClientPlanFilter;
  onPlanFilterChange: (value: ClientPlanFilter) => void;
  sourceFilter: ClientSourceFilter;
  onSourceFilterChange: (value: ClientSourceFilter) => void;
  sortBy: ClientSortOption;
  onSortByChange: (value: ClientSortOption) => void;
  viewMode: "table" | "cards";
  onViewModeChange: (value: "table" | "cards") => void;
  countLabel: string;
};

export function ClientFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  planFilter,
  onPlanFilterChange,
  sourceFilter,
  onSourceFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  countLabel,
}: ClientFiltersProps) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="h-10 pl-9"
          />
        </div>

        <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-1 lg:flex">
          <ViewToggleButton
            active={viewMode === "table"}
            label="Tabela"
            onClick={() => onViewModeChange("table")}
          >
            <Table2 className="h-4 w-4" />
          </ViewToggleButton>
          <ViewToggleButton
            active={viewMode === "cards"}
            label="Cards"
            onClick={() => onViewModeChange("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </ViewToggleButton>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(value) =>
            onStatusFilterChange(value as ClientStatusFilter)
          }
          options={[
            { value: "all", label: "Todos" },
            { value: "active", label: "Ativo" },
            { value: "inactive", label: "Inativo" },
          ]}
        />
        <FilterSelect
          label="Plano"
          value={planFilter}
          onChange={(value) => onPlanFilterChange(value as ClientPlanFilter)}
          options={[
            { value: "all", label: "Todos" },
            { value: "free", label: "Free" },
            { value: "premium", label: "Premium" },
          ]}
        />
        <FilterSelect
          label="Origem"
          value={sourceFilter}
          onChange={(value) =>
            onSourceFilterChange(value as ClientSourceFilter)
          }
          options={[
            { value: "all", label: "Todas" },
            { value: "import_json", label: "import:json" },
            { value: "manual", label: "Cadastro manual" },
            { value: "checkout", label: "Checkout" },
            { value: "keycloak", label: "Keycloak" },
            { value: "webhook", label: "Webhook" },
          ]}
        />
        <FilterSelect
          label="Ordenação"
          value={sortBy}
          onChange={(value) => onSortByChange(value as ClientSortOption)}
          options={[
            { value: "recent", label: "Mais recentes" },
            { value: "oldest", label: "Mais antigos" },
            { value: "name", label: "Nome A-Z" },
            { value: "last_access", label: "Último acesso" },
          ]}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">{countLabel}</p>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-1 lg:hidden">
          <ViewToggleButton
            active={viewMode === "table"}
            label="Tabela"
            onClick={() => onViewModeChange("table")}
          >
            <Table2 className="h-4 w-4" />
          </ViewToggleButton>
          <ViewToggleButton
            active={viewMode === "cards"}
            label="Cards"
            onClick={() => onViewModeChange("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </ViewToggleButton>
        </div>
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

function ViewToggleButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition",
        active
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
      )}
      onClick={onClick}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
