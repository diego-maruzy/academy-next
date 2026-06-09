import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Test | Checkmate Academy",
  robots: "noindex",
};

const ROUTE_CHECKS = [
  { label: "Login aluno", href: "/login" },
  { label: "OIDC login (mobile)", href: "/oidc/login" },
  { label: "Auth debug", href: "/auth-debug" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Login admin", href: "/admin/login" },
  { label: "Programas", href: "/programas" },
] as const;

export default function TestPage() {
  const checkedAt = new Date().toISOString();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-[#050814] px-5 py-10 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          Página de teste
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Deploy & rotas</h1>
        <p className="mt-2 text-sm text-slate-400">
          Use esta página para confirmar que o deploy mais recente está no ar e
          testar entradas de login.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
        <Row label="Status" value="ok" />
        <Row label="Verificado em" value={checkedAt} />
        <Row label="Ambiente" value={process.env.NODE_ENV ?? "—"} />
        <Row
          label="Build"
          value={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}
        />
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
          Rotas para testar
        </p>
        <ul className="grid gap-2">
          {ROUTE_CHECKS.map((route) => (
            <li key={route.href}>
              <Link
                href={route.href}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10"
              >
                <span>{route.label}</span>
                <span className="font-mono text-xs text-slate-500">{route.href}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-white/[0.06] pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span className="break-all text-slate-200">{value}</span>
    </div>
  );
}
