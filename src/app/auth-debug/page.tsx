import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { mapKeycloakRolesToAppRole } from "@/lib/auth/keycloak-roles";

export const dynamic = "force-dynamic";

export default async function AuthDebugPage() {
  const [session, adminSession] = await Promise.all([auth(), getCurrentAdmin()]);

  if (!session?.user) {
    redirect("/login?callbackUrl=/auth-debug");
  }

  const roles = session.user.roles ?? [];
  const appRole = session.user.appRole ?? mapKeycloakRolesToAppRole(roles);
  const rolesSource = session.user.rolesSource ?? (roles.length > 0 ? "keycloak" : "fallback");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-[#050814] px-5 py-10 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          Debug temporário
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Auth Debug</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sessão Keycloak (aluno). Tokens completos não são exibidos. Painel admin
          usa login separado em /admin/login.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
          Keycloak
        </p>
        <Row label="Logado" value="sim" />
        <Row label="Nome" value={session.user.name ?? "—"} />
        <Row label="Email" value={session.user.email ?? "—"} />
        <Row label="Provider" value={session.user.provider ?? "—"} />
        <Row label="Roles" value={roles.length > 0 ? roles.join(", ") : "—"} />
        <Row label="App role" value={appRole} />
        <Row
          label="Source da role"
          value={
            rolesSource === "keycloak"
              ? "keycloak"
              : "fallback (nenhuma role encontrada no token)"
          }
        />
        <Row label="User id" value={session.user.id || "—"} />
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
          Sessão admin/equipe (separada)
        </p>
        <Row label="Admin logado" value={adminSession ? "sim" : "não"} />
        <Row label="Admin email" value={adminSession?.email ?? "—"} />
        <Row label="Admin permission" value={adminSession?.permission ?? "—"} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Ir para dashboard
        </Link>
        <Link
          href="/admin/login"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Login admin
        </Link>
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
