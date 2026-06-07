"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Video } from "lucide-react";
import { AdminShortCard } from "@/components/admin/shorts/admin-short-card";
import { AdminShortsStats } from "@/components/admin/shorts/admin-shorts-stats";
import {
  AdminShortsToolbar,
  type ShortProviderFilter,
  type ShortSortOption,
  type ShortStatusFilter,
} from "@/components/admin/shorts/admin-shorts-toolbar";
import { checkoutBrandGradientClass } from "@/components/checkout/checkout-theme";
import type { AcademyShort } from "@/types/shorts";
import { cn } from "@/lib/utils";

type AdminShortsPageContentProps = {
  shorts: AcademyShort[];
};

function filterShorts(
  shorts: AcademyShort[],
  search: string,
  statusFilter: ShortStatusFilter,
  providerFilter: ShortProviderFilter,
  sortBy: ShortSortOption,
) {
  const query = search.trim().toLowerCase();

  let filtered = shorts.filter((short) => {
    const matchesSearch =
      !query ||
      short.title.toLowerCase().includes(query) ||
      (short.category?.toLowerCase().includes(query) ?? false) ||
      short.slug.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && short.published) ||
      (statusFilter === "draft" && !short.published);

    const matchesProvider =
      providerFilter === "all" || short.video_provider === providerFilter;

    return matchesSearch && matchesStatus && matchesProvider;
  });

  filtered = [...filtered].sort((left, right) => {
    if (sortBy === "title") {
      return left.title.localeCompare(right.title, "pt-BR");
    }

    if (sortBy === "recent") {
      return (
        new Date(right.created_at).getTime() -
        new Date(left.created_at).getTime()
      );
    }

    return left.display_order - right.display_order;
  });

  return filtered;
}

export function AdminShortsPageContent({ shorts }: AdminShortsPageContentProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShortStatusFilter>("all");
  const [providerFilter, setProviderFilter] =
    useState<ShortProviderFilter>("all");
  const [sortBy, setSortBy] = useState<ShortSortOption>("order");

  const filteredShorts = useMemo(
    () => filterShorts(shorts, search, statusFilter, providerFilter, sortBy),
    [shorts, search, statusFilter, providerFilter, sortBy],
  );

  return (
    <div className="grid min-w-0 gap-6 md:gap-8">
      <section className="flex w-full flex-col gap-5 sm:gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Conteúdo vertical
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Gestão de Reels
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Gerencie vídeos verticais da Academy no feed de Reels — Vimeo,
            YouTube, CTAs e categorias.
          </p>
        </div>

        <Link
          href="/admin/shorts/novo"
          className={cn(
            "inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition sm:w-auto",
            checkoutBrandGradientClass,
            "shadow-lg shadow-sky-500/20 hover:brightness-105 active:scale-[0.99]",
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Reel
        </Link>
      </section>

      <AdminShortsStats shorts={shorts} />

      {shorts.length > 0 ? (
        <>
          <AdminShortsToolbar
            search={search}
            statusFilter={statusFilter}
            providerFilter={providerFilter}
            sortBy={sortBy}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onProviderFilterChange={setProviderFilter}
            onSortChange={setSortBy}
          />

          {filteredShorts.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
              {filteredShorts.map((short) => (
                <AdminShortCard key={short.id} short={short} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white">
                Nenhum short encontrado
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Ajuste a busca ou os filtros para localizar um short.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#0B1220]/90 px-6 py-14 text-center sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-300">
            <Video className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-white">
            Nenhum short cadastrado
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Crie seu primeiro short vertical com link do Vimeo ou YouTube.
          </p>
          <Link
            href="/admin/shorts/novo"
            className={cn(
              "mt-6 inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition",
              checkoutBrandGradientClass,
              "shadow-lg shadow-sky-500/20 hover:brightness-105",
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Reel
          </Link>
        </div>
      )}
    </div>
  );
}
