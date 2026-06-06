"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentSidebar() {
  const pathname = usePathname();
  const active =
    pathname === "/programas" || pathname.startsWith("/programas/");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-[#070B13] px-4 py-6 shadow-2xl shadow-black/30 lg:block">
      <div className="mb-9 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-lg font-black text-white shadow-lg shadow-blue-500/25">
          C
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Checkmate
          </p>
          <h1 className="text-lg font-semibold text-white">Academy</h1>
        </div>
      </div>

      <nav>
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Navegação
        </p>
        <Link
          href="/programas"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white",
            active &&
              "border border-white/10 bg-white/10 text-white shadow-lg shadow-black/20",
          )}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>Programas</span>
        </Link>
      </nav>
    </aside>
  );
}
