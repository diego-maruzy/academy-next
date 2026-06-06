"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { AdminProgramCard } from "@/components/admin/programs/admin-program-card";
import { AdminProgramsSortableList } from "@/components/admin/programs/admin-programs-sortable-list";
import {
  AdminProgramsToolbar,
  type ProgramPremiumFilter,
  type ProgramSortOption,
  type ProgramStatusFilter,
} from "@/components/admin/programs/admin-programs-toolbar";
import { AdminProgramsStats } from "@/components/admin/programs/admin-programs-stats";
import { checkoutBrandGradientClass } from "@/components/checkout/checkout-theme";
import type { ProgramWithModules } from "@/types/academy";
import { cn } from "@/lib/utils";

type AdminProgramsPageContentProps = {
  programs: ProgramWithModules[];
};

function filterPrograms(
  programs: ProgramWithModules[],
  search: string,
  statusFilter: ProgramStatusFilter,
  premiumFilter: ProgramPremiumFilter,
  sortBy: ProgramSortOption,
) {
  const query = search.trim().toLowerCase();

  let filtered = programs.filter((program) => {
    const matchesSearch =
      !query ||
      program.name.toLowerCase().includes(query) ||
      program.slug.toLowerCase().includes(query) ||
      (program.description?.toLowerCase().includes(query) ?? false);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && program.published) ||
      (statusFilter === "draft" && !program.published);

    const matchesPremium =
      premiumFilter === "all" ||
      (premiumFilter === "premium" && program.is_premium) ||
      (premiumFilter === "free" && !program.is_premium);

    return matchesSearch && matchesStatus && matchesPremium;
  });

  filtered = [...filtered].sort((left, right) => {
    if (sortBy === "name") {
      return left.name.localeCompare(right.name, "pt-BR");
    }

    if (sortBy === "recent") {
      return (
        new Date(right.updated_at).getTime() -
        new Date(left.updated_at).getTime()
      );
    }

    return left.display_order - right.display_order;
  });

  return filtered;
}

export function AdminProgramsPageContent({
  programs,
}: AdminProgramsPageContentProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ProgramStatusFilter>("all");
  const [premiumFilter, setPremiumFilter] =
    useState<ProgramPremiumFilter>("all");
  const [sortBy, setSortBy] = useState<ProgramSortOption>("order");

  const filteredPrograms = useMemo(
    () =>
      filterPrograms(
        programs,
        search,
        statusFilter,
        premiumFilter,
        sortBy,
      ),
    [programs, search, statusFilter, premiumFilter, sortBy],
  );

  const canReorder =
    sortBy === "order" &&
    !search.trim() &&
    statusFilter === "all" &&
    premiumFilter === "all";

  return (
    <div className="grid min-w-0 gap-6 md:gap-8">
      <section className="flex w-full flex-col gap-5 sm:gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10 xl:gap-12">
        <div className="min-w-0 flex-1 lg:max-w-none lg:pr-4 xl:pr-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Programas
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl xl:text-[2.5rem]">
            Gestão de conteúdo
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-400 sm:text-base xl:max-w-5xl">
            Gerencie programas, módulos, aulas, status premium e links de
            upgrade.
          </p>
        </div>

        <Link
          href="/admin/programas/novo"
          className={cn(
            "inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition sm:w-auto lg:mt-1",
            checkoutBrandGradientClass,
            "shadow-lg shadow-sky-500/20 hover:brightness-105 active:scale-[0.99]",
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo programa
        </Link>
      </section>

      <AdminProgramsStats programs={programs} />

      {programs.length > 0 ? (
        <>
          <AdminProgramsToolbar
            search={search}
            statusFilter={statusFilter}
            premiumFilter={premiumFilter}
            sortBy={sortBy}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onPremiumFilterChange={setPremiumFilter}
            onSortChange={setSortBy}
          />

          {filteredPrograms.length > 0 ? (
            canReorder ? (
              <AdminProgramsSortableList
                key={programs
                  .map((program) => `${program.id}:${program.display_order}`)
                  .join("|")}
                programs={programs}
              />
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {sortBy === "order" ? (
                  <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    Limpe a busca e os filtros para reordenar os programas por
                    arrastar e soltar.
                  </p>
                ) : null}
                {filteredPrograms.map((program) => (
                  <AdminProgramCard key={program.id} program={program} />
                ))}
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white">
                Nenhum programa encontrado
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Ajuste a busca ou os filtros para localizar um programa.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#0B1220]/90 px-6 py-14 text-center sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-300">
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-white">
            Nenhum programa cadastrado
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Crie seu primeiro programa para começar a organizar módulos e aulas.
          </p>
          <Link
            href="/admin/programas/novo"
            className={cn(
              "mt-6 inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition",
              checkoutBrandGradientClass,
              "shadow-lg shadow-sky-500/20 hover:brightness-105 active:scale-[0.99]",
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo programa
          </Link>
        </div>
      )}
    </div>
  );
}
