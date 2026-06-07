"use client";

import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

export type ShortStatusFilter = "all" | "published" | "draft";
export type ShortProviderFilter = "all" | "supabase" | "vimeo" | "youtube";
export type ShortSortOption = "order" | "title" | "recent";

type AdminShortsToolbarProps = {
  search: string;
  statusFilter: ShortStatusFilter;
  providerFilter: ShortProviderFilter;
  sortBy: ShortSortOption;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ShortStatusFilter) => void;
  onProviderFilterChange: (value: ShortProviderFilter) => void;
  onSortChange: (value: ShortSortOption) => void;
  className?: string;
};

export function AdminShortsToolbar({
  search,
  statusFilter,
  providerFilter,
  sortBy,
  onSearchChange,
  onStatusFilterChange,
  onProviderFilterChange,
  onSortChange,
  className,
}: AdminShortsToolbarProps) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5",
        "lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.7fr))]",
        className,
      )}
    >
      <label className="relative block min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por título ou categoria..."
          className="pl-10"
        />
      </label>

      <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-300">
        Status
        <Select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as ShortStatusFilter)
          }
        >
          <option value="all">Todos</option>
          <option value="published">Publicado</option>
          <option value="draft">Rascunho</option>
        </Select>
      </label>

      <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-300">
        Origem
        <Select
          value={providerFilter}
          onChange={(event) =>
            onProviderFilterChange(event.target.value as ShortProviderFilter)
          }
        >
          <option value="all">Todas</option>
          <option value="supabase">Supabase</option>
          <option value="vimeo">Vimeo</option>
          <option value="youtube">YouTube</option>
        </Select>
      </label>

      <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-300">
        Ordenação
        <Select
          value={sortBy}
          onChange={(event) =>
            onSortChange(event.target.value as ShortSortOption)
          }
        >
          <option value="order">Ordem</option>
          <option value="title">Título</option>
          <option value="recent">Mais recentes</option>
        </Select>
      </label>
    </div>
  );
}
