"use client";

import { useTransition } from "react";
import { Grid3X3, LogOut, Settings, Sun } from "lucide-react";
import { AdminHeaderSearch } from "@/components/layout/admin-header-search";
import { useCurrentAdmin } from "@/components/auth/admin-provider";
import { getAdminBadgeLabel, isAdmin } from "@/lib/admin-auth/permissions";
import { logoutAdminAction } from "@/lib/actions/admin-logout-actions";

export function AdminHeader() {
  const admin = useCurrentAdmin();
  const [isPending, startTransition] = useTransition();
  const roleLabel = getAdminBadgeLabel(admin);
  const userInitial = admin.full_name.charAt(0).toUpperCase();

  function handleLogout() {
    startTransition(async () => {
      await logoutAdminAction();
    });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050814]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] w-full max-w-[1500px] items-center gap-4 px-5 sm:gap-6 lg:gap-8 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:min-w-[200px] lg:min-w-[220px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-blue-300">
            <Grid3X3 className="h-4 w-4" />
          </div>
          <span className="hidden text-sm font-semibold text-white sm:inline">
            Academy
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {roleLabel}
          </span>
        </div>

        {isAdmin(admin) ? (
          <div className="hidden min-w-0 flex-1 md:block lg:max-w-3xl xl:max-w-4xl">
            <AdminHeaderSearch />
          </div>
        ) : (
          <div className="hidden min-w-0 flex-1 md:block" />
        )}

        <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:gap-3 lg:min-w-[220px]">
          {isAdmin(admin) ? (
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex">
              <Sun className="h-4 w-4" />
            </button>
          ) : null}
          {isAdmin(admin) ? (
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex">
              <Settings className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1 pl-1 pr-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-emerald-400 text-xs font-bold text-slate-950">
              {userInitial}
            </div>
            <span className="hidden text-sm font-medium text-white sm:inline">
              {admin.full_name}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
