"use client";

import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

export type ProgramStatusFilter = "all" | "published" | "draft";
export type ProgramPremiumFilter = "all" | "premium" | "free";
export type ProgramSortOption = "order" | "name" | "recent";

type AdminProgramsToolbarProps = {
  search: string;
  statusFilter: ProgramStatusFilter;
  premiumFilter: ProgramPremiumFilter;
  sortBy: ProgramSortOption;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ProgramStatusFilter) => void;
  onPremiumFilterChange: (value: ProgramPremiumFilter) => void;
  onSortChange: (value: ProgramSortOption) => void;
  className?: string;
};

export function AdminProgramsToolbar({
  search,
  statusFilter,
  premiumFilter,
  sortBy,
  onSearchChange,
  onStatusFilterChange,
  onPremiumFilterChange,
  onSortChange,
  className,
}: AdminProgramsToolbarProps) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5",
        "lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))]",
        className,
      )}
    >
      <label className="relative block min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar programa..."
          className="pl-10"
        />
      </label>

      <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-300">
        Status
        <Select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as ProgramStatusFilter)
          }
        >
          <option value="all">Todos</option>
          <option value="published">Publicado</option>
          <option value="draft">Rascunho</option>
        </Select>
      </label>

      <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-300">
        Premium
        <Select
          value={premiumFilter}
          onChange={(event) =>
            onPremiumFilterChange(event.target.value as ProgramPremiumFilter)
          }
        >
          <option value="all">Todos</option>
          <option value="premium">Premium</option>
          <option value="free">Gratuito</option>
        </Select>
      </label>

      <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-300">
        Ordenação
        <Select
          value={sortBy}
          onChange={(event) =>
            onSortChange(event.target.value as ProgramSortOption)
          }
        >
          <option value="order">Ordem</option>
          <option value="name">Nome</option>
          <option value="recent">Mais recentes</option>
        </Select>
      </label>
    </div>
  );
}
