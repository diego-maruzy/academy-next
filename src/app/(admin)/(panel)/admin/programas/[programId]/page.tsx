import { notFound } from "next/navigation";
import { Edit3, Eye, Plus } from "lucide-react";
import { DeleteConfirmButton } from "@/components/admin/programs/delete-confirm-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLessonsByModuleId, getProgramById } from "@/lib/academy-data";

type AdminProgramDetailPageProps = {
  params: Promise<{ programId: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminProgramDetailPage({
  params,
}: AdminProgramDetailPageProps) {
  const { programId } = await params;
  const program = await getProgramById(programId);

  if (!program) {
    notFound();
  }

  const lessonCounts = new Map(
    await Promise.all(
      program.modules.map(async (programModule): Promise<[string, number]> => [
        programModule.id,
        (await getLessonsByModuleId(programModule.id)).length,
      ]),
    ),
  );

  return (
    <div className="grid gap-8">
      <Card>
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{program.published ? "Publicado" : "Rascunho"}</Badge>
              {program.is_premium ? (
                <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-200">
                  Premium
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              {program.name}
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              {program.description ?? "Sem descrição cadastrada."}
            </p>
          </div>

          <div className="flex flex-wrap items-start justify-end gap-3">
            <ButtonLink href={`/admin/programas/${program.id}/editar`} variant="secondary">
              <Edit3 className="mr-2 h-4 w-4" />
              Editar programa
            </ButtonLink>
            <ButtonLink href={`/admin/programas/${program.id}/modulos/novo`}>
              <Plus className="mr-2 h-4 w-4" />
              Novo módulo
            </ButtonLink>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Módulos</h2>
          <p className="mt-2 text-slate-400">
            Gerencie os módulos reais deste programa.
          </p>
        </div>

        {program.modules.map((programModule) => (
          <Card key={programModule.id}>
            <CardContent className="grid gap-5 pt-6 lg:grid-cols-[1fr_auto]">
              <div className="flex gap-4">
                <div
                  className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 bg-cover bg-center"
                  style={{
                    backgroundImage: programModule.cover_image_url
                      ? `linear-gradient(rgba(2,6,23,.15), rgba(2,6,23,.65)), url(${programModule.cover_image_url})`
                      : "linear-gradient(135deg, rgba(59,130,246,.35), rgba(15,23,42,.9))",
                  }}
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {programModule.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    slug: {programModule.slug}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                      ordem {programModule.display_order}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                      {lessonCounts.get(programModule.id) ?? 0} aulas
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <ButtonLink
                  href={`/admin/programas/${program.id}/modulos/${programModule.id}`}
                  variant="secondary"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver
                </ButtonLink>
                <ButtonLink
                  href={`/admin/programas/${program.id}/modulos/${programModule.id}/editar`}
                  variant="secondary"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Editar
                </ButtonLink>
                <DeleteConfirmButton
                  type="module"
                  id={programModule.id}
                  programId={program.id}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
