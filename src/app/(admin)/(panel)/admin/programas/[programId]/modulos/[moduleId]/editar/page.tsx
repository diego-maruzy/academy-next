import { notFound } from "next/navigation";
import { AdminModuleForm } from "@/components/admin/programs/admin-module-form";
import { getModuleById, getProgramById } from "@/lib/academy-data";

type EditAdminModulePageProps = {
  params: Promise<{ programId: string; moduleId: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditAdminModulePage({
  params,
}: EditAdminModulePageProps) {
  const { programId, moduleId } = await params;
  const [program, programModule] = await Promise.all([
    getProgramById(programId),
    getModuleById(moduleId),
  ]);

  if (!program || !programModule) {
    notFound();
  }

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          {program.name}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Editar módulo
        </h1>
      </section>

      <AdminModuleForm
        programId={program.id}
        moduleId={programModule.id}
        defaultValues={{
          program_id: program.id,
          name: programModule.name,
          slug: programModule.slug,
          description: programModule.description ?? "",
          display_order: programModule.display_order,
          cover_image_url: programModule.cover_image_url,
        }}
      />
    </div>
  );
}
