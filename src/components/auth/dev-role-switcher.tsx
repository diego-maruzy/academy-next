"use client";

import { useRouter } from "next/navigation";
import { DEV_ROLE_COOKIE } from "@/lib/auth/constants";
import { ROLE_LABELS, type UserRole } from "@/lib/auth/roles";
import { useCurrentUser } from "@/components/auth/user-provider";

const ROLES: UserRole[] = ["client", "team", "admin"];

export function DevRoleSwitcher() {
  const router = useRouter();
  const user = useCurrentUser();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  function handleChange(role: UserRole) {
    document.cookie = `${DEV_ROLE_COOKIE}=${role}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-[#111827] px-3 py-2 shadow-2xl shadow-black/40">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">
        Dev role
      </span>
      <select
        value={user.role}
        onChange={(event) => handleChange(event.target.value as UserRole)}
        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none"
      >
        {ROLES.map((role) => (
          <option key={role} value={role} className="bg-slate-900">
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </div>
  );
}
