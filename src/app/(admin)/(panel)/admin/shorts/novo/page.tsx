import { AdminShortForm } from "@/components/admin/shorts/admin-short-form";

export default function NewAdminShortPage() {
  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          Shorts
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Novo short
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Cadastre um vídeo vertical com link do Vimeo ou YouTube.
        </p>
      </section>

      <AdminShortForm />
    </div>
  );
}
