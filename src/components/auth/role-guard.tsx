"use client";

import { ShieldOff } from "lucide-react";
import { useCurrentUser } from "@/components/auth/user-provider";
import type { UserRole } from "@/lib/auth/roles";

type RoleGuardProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useCurrentUser();

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center">
        <div className="mb-5 rounded-2xl bg-rose-500/10 p-4 text-rose-300">
          <ShieldOff className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Acesso restrito</h1>
        <p className="mt-3 max-w-md text-sm text-slate-400">
          Acesso restrito. Sua conta não possui permissão para acessar esta
          área.
        </p>
      </div>
    );
  }

  return children;
}
