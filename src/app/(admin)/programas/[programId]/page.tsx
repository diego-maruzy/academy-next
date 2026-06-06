import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleCarousel } from "@/components/programs/module-carousel";
import { Card, CardContent } from "@/components/ui/card";
import { getProgramBySlug } from "@/lib/academy-data";
import { getCurrentClient } from "@/lib/current-client";
import {
  countCompletedModules,
  getProgramModuleProgressMap,
} from "@/lib/progress-data";
import { recordStudentActivity } from "@/lib/student-activity";

type ProgramDetailPageProps = {
  params: Promise<{ programId: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProgramDetailPage({
  params,
}: ProgramDetailPageProps) {
  const { programId: programSlug } = await params;
  const program = await getProgramBySlug(programSlug);

  if (!program) {
    notFound();
  }

  const client = await getCurrentClient();

  if (client) {
    void recordStudentActivity({
      clientId: client.id,
      programId: program.id,
      eventType: "program_view",
    });
  }

  const moduleProgressMap = client
    ? await getProgramModuleProgressMap(client.id, program.slug)
    : {};
  const completedModules = countCompletedModules(
    program.modules,
    moduleProgressMap,
  );
  const totalModules = program.modules.length;
  const progressPercent =
    totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

  return (
    <div className="grid min-w-0 gap-6 md:gap-8">
      <Card className="overflow-hidden bg-white/[0.04]">
        <CardContent className="pt-5 md:pt-6">
          <div className="min-w-0">
            <Link
              href="/programas"
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-slate-400 transition active:scale-[0.98] hover:text-white"
            >
              ← Programas
            </Link>
            <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl md:mt-4 md:text-4xl">
              {program.name}
            </h1>
            <p className="mt-2 max-w-3xl break-words text-sm text-slate-400 md:mt-3 md:text-base">
              {program.description ?? "Programa disponível na Academy."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-400 md:mt-6 md:gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {program.modules.length} módulos
              </span>
              {program.is_premium ? (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-amber-200">
                  Premium
                </span>
              ) : null}
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Experiência do aluno
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ModuleCarousel
        title="Módulos do programa"
        subtitle="Abra um módulo para ver aulas, CTA e materiais."
        progressLabel={`${completedModules}/${totalModules}`}
        progressPercent={progressPercent}
        academyModules={program.modules}
        programSlug={program.slug}
        programName={program.name}
        isPremium={program.is_premium}
        moduleProgressMap={moduleProgressMap}
      />
    </div>
  );
}
