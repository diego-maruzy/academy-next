"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type StudentLogoutButtonProps = {
  className?: string;
  compact?: boolean;
};

export function StudentLogoutButton({
  className,
  compact = false,
}: StudentLogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const Icon = loading ? Loader2 : LogOut;

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-70",
        compact ? "h-10 w-10" : "px-3 py-2.5",
        className,
      )}
      aria-label="Sair da conta"
      title="Sair"
    >
      <Icon className={cn("h-4 w-4", loading && "animate-spin")} />
      {compact ? null : <span>Sair</span>}
    </button>
  );
}
