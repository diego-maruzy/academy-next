import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ModuleCompletionButton } from "@/components/programs/module-completion-button";
import { ModulePlayer } from "@/components/programs/module-player";
import { ProgramProgressPanel } from "@/components/programs/program-progress-panel";
import { PremiumLockedState } from "@/components/student/premium-locked-state";
import { ButtonLink } from "@/components/ui/button";
import {
  getFirstLessonFromModule,
  getModuleBySlug,
  getModulesByProgramSlug,
  getPreviousAndNextModule,
  getProgramBySlug,
} from "@/lib/academy-data";
import { getCurrentClient } from "@/lib/current-client";
import {
  getProgramModuleProgressMap,
  isLessonCompletedForClient,
} from "@/lib/progress-data";
import { recordStudentActivity } from "@/lib/student-activity";
import { studentHasProgramAccess } from "@/lib/student-access";
import { cn } from "@/lib/utils";

type ModuleDetailPageProps = {
  params: Promise<{ programId: string; moduleId: string }>;
};

export const dynamic = "force-dynamic";

export default async function ModuleDetailPage({
  params,
}: ModuleDetailPageProps) {
  const { programId: programSlug, moduleId: moduleSlug } = await params;
  const program = await getProgramBySlug(programSlug);
  const programModule = await getModuleBySlug(programSlug, moduleSlug);

  if (!program || !programModule) {
    notFound();
  }

  const client = await getCurrentClient();
  const hasAccess = studentHasProgramAccess(program, client);
  const locked = program.is_premium && !hasAccess;

  const [lesson, modules, navigation, moduleProgressMap] = await Promise.all([
    getFirstLessonFromModule(program.slug, programModule.slug),
    getModulesByProgramSlug(program.slug),
    getPreviousAndNextModule(program.slug, programModule.slug),
    client
      ? getProgramModuleProgressMap(client.id, program.slug)
      : Promise.resolve({}),
  ]);

  if (client && hasAccess) {
    void recordStudentActivity({
      clientId: client.id,
      programId: program.id,
      moduleId: programModule.id,
      eventType: "module_view",
    });

    if (lesson) {
      void recordStudentActivity({
        clientId: client.id,
        programId: program.id,
        moduleId: programModule.id,
        lessonId: lesson.id,
        eventType: "lesson_view",
      });
    }
  }

  const { previousModule, nextModule } = navigation;
  const title = lesson?.name ?? programModule.name;
  const ctaText = lesson?.cta_text || "Falar com um Analista";

  const initialLessonCompleted =
    client && lesson
      ? await isLessonCompletedForClient(client.id, lesson.id)
      : false;

  const completionDisabledReason = !lesson
    ? "Este módulo ainda não possui aula cadastrada."
    : undefined;

  return (
    <div className="grid min-w-0 gap-6 md:gap-8">
      <section className="min-w-0">
        <Link
          href="/programas"
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-slate-400 transition active:scale-[0.98] hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{program.name}</span>
        </Link>
        <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl md:mt-4 md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl break-words text-sm text-slate-400 md:text-base">
          {lesson ? programModule.name : "Este módulo ainda não possui aula cadastrada."}
        </p>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="grid min-w-0 gap-4 md:gap-5">
          {locked ? (
            <PremiumLockedState
              title="Este conteúdo é premium"
              description="Faça upgrade para acessar este programa."
              upgradeUrl={program.upgrade_url}
            />
          ) : (
            <>
          <ModulePlayer
            title={title}
            mediaType={lesson?.media_type}
            videoUrl={lesson?.vimeo_url ?? null}
            imageUrl={lesson?.image_url ?? programModule.cover_image_url}
          />

          {lesson?.cta_url ? (
            <a
              href={lesson.cta_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-full min-h-[44px] items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] hover:bg-emerald-400"
            >
              {ctaText}
            </a>
          ) : lesson ? (
            <span className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-bold text-slate-500">
              {ctaText}
            </span>
          ) : null}

          <div className="grid min-w-0 gap-3 lg:grid-cols-3 lg:items-start">
            <div className="order-1 lg:order-2">
              <ModuleCompletionButton
                clientId={client?.id ?? null}
                lessonId={lesson?.id ?? null}
                programId={program.id}
                moduleId={programModule.id}
                initialCompleted={initialLessonCompleted}
                programSlug={program.slug}
                moduleSlug={programModule.slug}
                disabledReason={completionDisabledReason}
              />
            </div>

            <div className="order-2 grid grid-cols-2 gap-3 lg:contents">
              {previousModule ? (
                <ButtonLink
                  href={`/programas/${program.slug}/modulos/${previousModule.slug}`}
                  variant="secondary"
                  className="min-h-[44px] w-full active:scale-[0.98] lg:order-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                  Anterior
                </ButtonLink>
              ) : (
                <span
                  className={cn(
                    "inline-flex min-h-[44px] items-center justify-center rounded-xl",
                    "border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-600 opacity-50",
                    "lg:order-1",
                  )}
                >
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                  Anterior
                </span>
              )}

              {nextModule ? (
                <ButtonLink
                  href={`/programas/${program.slug}/modulos/${nextModule.slug}`}
                  variant="secondary"
                  className="min-h-[44px] w-full active:scale-[0.98] lg:order-3 lg:justify-self-end"
                >
                  Próxima
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                </ButtonLink>
              ) : (
                <span
                  className={cn(
                    "inline-flex min-h-[44px] items-center justify-center rounded-xl",
                    "border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-600 opacity-50",
                    "lg:order-3 lg:justify-self-end",
                  )}
                >
                  Próxima
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                </span>
              )}
            </div>
          </div>
            </>
          )}
        </div>

        {!locked ? (
          <ProgramProgressPanel
            program={program}
            modules={modules}
            currentModuleSlug={programModule.slug}
            moduleProgressMap={moduleProgressMap}
          />
        ) : null}
      </section>
    </div>
  );
}
