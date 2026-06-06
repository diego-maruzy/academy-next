"use client";

import { User } from "lucide-react";
import { useCurrentUser } from "@/components/auth/user-provider";

export function StudentHeader() {
  const user = useCurrentUser();
  const userInitial = user.name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050814]/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:h-[72px] md:gap-4 md:px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-sm font-black text-white shadow-lg shadow-blue-500/25 md:h-9 md:w-9 md:rounded-xl">
            C
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white md:text-base">
              Academy
            </p>
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:block">
              Checkmate
            </p>
          </div>
          <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:inline">
            ALUNO
          </span>
        </div>

        <button
          type="button"
          className="flex h-11 min-w-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1 pl-1 pr-3 transition active:scale-[0.98] md:h-auto"
          aria-label={`Perfil de ${user.name}`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-emerald-400 text-xs font-bold text-slate-950">
            {userInitial}
          </div>
          <span className="hidden text-sm font-medium text-white sm:inline">
            {user.name}
          </span>
          <User className="h-4 w-4 text-slate-400 sm:hidden" />
        </button>
      </div>
    </header>
  );
}
