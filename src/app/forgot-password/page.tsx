import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recuperar senha | Checkmate Academy",
  robots: "noindex",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050814] px-5 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/30">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-lg font-black text-white shadow-lg shadow-blue-500/25">
            C
          </div>
          <h1 className="text-2xl font-semibold">Recuperar senha</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Informe seu e-mail para receber o link de redefinição.
          </p>
        </div>

        <ForgotPasswordForm />
      </section>
    </main>
  );
}
