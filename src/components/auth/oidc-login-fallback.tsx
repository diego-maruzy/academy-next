import { signIn } from "@/auth";

type OidcLoginFallbackProps = {
  redirectTo: string;
};

async function continueKeycloakLogin(redirectTo: string) {
  "use server";

  const keycloakUrl = await signIn("keycloak", {
    redirectTo,
    redirect: false,
  });

  if (typeof keycloakUrl === "string" && keycloakUrl.length > 0) {
    const { redirect } = await import("next/navigation");
    redirect(keycloakUrl);
  }
}

export function OidcLoginFallback({ redirectTo }: OidcLoginFallbackProps) {
  const continueLogin = continueKeycloakLogin.bind(null, redirectTo);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050814] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/40">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
          Checkmate Academy
        </p>
        <h1 className="mt-4 text-xl font-semibold text-white">
          Não foi possível iniciar o login automaticamente.
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Toque em continuar para abrir o acesso Checkmate.
        </p>
        <form action={continueLogin} className="mt-8">
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
          >
            Continuar login
          </button>
        </form>
      </div>
    </div>
  );
}
