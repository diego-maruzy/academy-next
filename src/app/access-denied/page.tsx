import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050814] px-5">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
          <ShieldOff className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Acesso negado</h1>
        <p className="mt-3 text-sm text-slate-400">
          Sua conta não possui permissão para acessar esta área administrativa.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-500 px-5 text-sm font-semibold text-white transition hover:bg-blue-400"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}
