import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata = {
  title: "Login administrativo | Checkmate Academy",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050814] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-xl font-black text-white shadow-lg shadow-blue-500/25">
            C
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Checkmate Academy
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            Acesso administrativo
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Entre com sua conta de equipe para gerenciar a Academy.
          </p>
        </div>

        <AdminLoginForm />
      </div>
    </div>
  );
}
