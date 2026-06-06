"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterOption = {
  value: string;
  label: string;
};

type EntityFiltersToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusValue: string;
  onStatusChange: (value: string) => void;
  statusOptions: FilterOption[];
  secondaryValue: string;
  onSecondaryChange: (value: string) => void;
  secondaryLabel: string;
  secondaryOptions: FilterOption[];
  countLabel: string;
  className?: string;
};

const fieldClass =
  "h-11 rounded-xl border border-white/10 bg-[#0B1220]/80 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10";

export function EntityFiltersToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  statusValue,
  onStatusChange,
  statusOptions,
  secondaryValue,
  onSecondaryChange,
  secondaryLabel,
  secondaryOptions,
  countLabel,
  className,
}: EntityFiltersToolbarProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0B1220]/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="relative sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className={cn(fieldClass, "w-full pl-10")}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Status
            </span>
            <select
              value={statusValue}
              onChange={(event) => onStatusChange(event.target.value)}
              className={fieldClass}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {secondaryLabel}
            </span>
            <select
              value={secondaryValue}
              onChange={(event) => onSecondaryChange(event.target.value)}
              className={fieldClass}
            >
              {secondaryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="shrink-0 text-sm font-medium text-slate-400 lg:pl-4">
          {countLabel}
        </p>
      </div>
    </div>
  );
}
