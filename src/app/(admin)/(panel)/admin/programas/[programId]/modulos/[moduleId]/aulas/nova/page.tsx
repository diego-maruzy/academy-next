import { notFound } from "next/navigation";
import { AdminLessonForm } from "@/components/admin/programs/admin-lesson-form";
import { getModuleById, getProgramById } from "@/lib/academy-data";

type NewAdminLessonPageProps = {
  params: Promise<{ programId: string; moduleId: string }>;
};

export const dynamic = "force-dynamic";

export default async function NewAdminLessonPage({
  params,
}: NewAdminLessonPageProps) {
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
          {program.name} / {programModule.name}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Nova aula
        </h1>
      </section>

      <AdminLessonForm programId={program.id} moduleId={programModule.id} />
    </div>
  );
}
