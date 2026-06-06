import { AdminProgramForm } from "@/components/admin/programs/admin-program-form";

export default function NewAdminProgramPage() {
  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          Gestão de conteúdo
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Novo programa
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Crie um programa real no Supabase.
        </p>
      </section>

      <AdminProgramForm />
    </div>
  );
}
