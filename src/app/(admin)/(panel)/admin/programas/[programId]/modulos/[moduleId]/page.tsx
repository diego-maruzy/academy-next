import { notFound } from "next/navigation";
import { Edit3, Plus } from "lucide-react";
import { DeleteConfirmButton } from "@/components/admin/programs/delete-confirm-button";
import { LessonMediaBadge } from "@/components/admin/programs/lesson-media-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getModuleById, getProgramById } from "@/lib/academy-data";

type AdminModuleDetailPageProps = {
  params: Promise<{ programId: string; moduleId: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminModuleDetailPage({
  params,
}: AdminModuleDetailPageProps) {
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
      <Card className="overflow-hidden">
        <div
          className="min-h-64 bg-cover bg-center"
          style={{
            backgroundImage: programModule.cover_image_url
              ? `linear-gradient(rgba(2,6,23,.15), rgba(2,6,23,.8)), url(${programModule.cover_image_url})`
              : "linear-gradient(135deg, rgba(59,130,246,.35), rgba(15,23,42,.95))",
          }}
        >
          <div className="flex min-h-64 items-end p-6">
            <div>
              <Badge>{program.name}</Badge>
              <h1 className="mt-4 text-3xl font-semibold text-white">
                {programModule.name}
              </h1>
              <p className="mt-2 text-slate-300">
                {programModule.description ?? "Sem descrição cadastrada."}
              </p>
            </div>
          </div>
        </div>
        <CardContent className="flex flex-wrap justify-end gap-3 pt-6">
          <ButtonLink
            href={`/admin/programas/${program.id}/modulos/${programModule.id}/editar`}
            variant="secondary"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Editar módulo
          </ButtonLink>
          <ButtonLink
            href={`/admin/programas/${program.id}/modulos/${programModule.id}/aulas/nova`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova aula
          </ButtonLink>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Aulas</h2>
          <p className="mt-2 text-slate-400">
            Gerencie as aulas reais deste módulo.
          </p>
        </div>

        {programModule.lessons.map((lesson) => (
          <Card key={lesson.id}>
            <CardContent className="grid gap-5 pt-6 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Aula {lesson.display_order}</Badge>
                  <LessonMediaBadge
                    mediaType={lesson.media_type}
                    vimeoUrl={lesson.vimeo_url}
                    imageUrl={lesson.image_url}
                  />
                  <h3 className="text-lg font-semibold text-white">
                    {lesson.name}
                  </h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    slug: {lesson.slug}
                  </span>
                  {lesson.media_type === "video" ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                      Vimeo: {lesson.vimeo_url ?? "Sem Vimeo"}
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                      Imagem: {lesson.image_url ? "Configurada" : "Sem imagem"}
                    </span>
                  )}
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    CTA: {lesson.cta_text ?? "Sem CTA"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <ButtonLink
                  href={`/admin/programas/${program.id}/modulos/${programModule.id}/aulas/${lesson.id}/editar`}
                  variant="secondary"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Editar
                </ButtonLink>
                <DeleteConfirmButton
                  type="lesson"
                  id={lesson.id}
                  moduleId={programModule.id}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
