import { notFound } from "next/navigation";
import { AdminLessonForm } from "@/components/admin/programs/admin-lesson-form";
import { getLessonById, getModuleById, getProgramById } from "@/lib/academy-data";

type EditAdminLessonPageProps = {
  params: Promise<{ programId: string; moduleId: string; lessonId: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditAdminLessonPage({
  params,
}: EditAdminLessonPageProps) {
  const { programId, moduleId, lessonId } = await params;
  const [program, programModule, lesson] = await Promise.all([
    getProgramById(programId),
    getModuleById(moduleId),
    getLessonById(lessonId),
  ]);

  if (!program || !programModule || !lesson) {
    notFound();
  }

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          {program.name} / {programModule.name}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Editar aula
        </h1>
      </section>

      <AdminLessonForm
        programId={program.id}
        moduleId={programModule.id}
        lessonId={lesson.id}
        defaultValues={{
          module_id: programModule.id,
          name: lesson.name,
          slug: lesson.slug,
          description: lesson.description ?? "",
          cta_url: lesson.cta_url,
          cta_text: lesson.cta_text ?? "",
          image_url: lesson.image_url,
          vimeo_url: lesson.vimeo_url,
          display_order: lesson.display_order,
        }}
      />
    </div>
  );
}
