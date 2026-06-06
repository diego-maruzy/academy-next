import { notFound } from "next/navigation";
import { AdminModuleForm } from "@/components/admin/programs/admin-module-form";
import { getProgramById } from "@/lib/academy-data";

type NewAdminModulePageProps = {
  params: Promise<{ programId: string }>;
};

export const dynamic = "force-dynamic";

export default async function NewAdminModulePage({
  params,
}: NewAdminModulePageProps) {
  const { programId } = await params;
  const program = await getProgramById(programId);

  if (!program) {
    notFound();
  }

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          {program.name}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Novo módulo
        </h1>
      </section>

      <AdminModuleForm programId={program.id} />
    </div>
  );
}
