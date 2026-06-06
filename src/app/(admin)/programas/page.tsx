import { ModuleCarousel } from "@/components/programs/module-carousel";
import { getPublishedPrograms } from "@/lib/academy-data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentClient } from "@/lib/current-client";
import {
  countCompletedModules,
  getProgramModuleProgressMap,
} from "@/lib/progress-data";
import { recordStudentActivity } from "@/lib/student-activity";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const user = await getCurrentUser();
  const client = await getCurrentClient();

  if (client) {
    void recordStudentActivity({
      clientId: client.id,
      eventType: "platform_access",
    });
  }

  const programs = await getPublishedPrograms();
  const moduleProgressMap = client
    ? await getProgramModuleProgressMap(client.id)
    : {};

  return (
    <div className="grid min-w-0 gap-6 md:gap-10">
      <section className="min-w-0">
        <div>
          <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            Olá, {user.name} 👋
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 md:mt-2 md:text-base">
            Continue de onde parou.
          </p>
        </div>
      </section>

      {programs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center md:p-8">
          <h2 className="text-lg font-semibold text-white md:text-xl">
            Nenhum programa publicado encontrado
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Verifique se existem programas publicados no Supabase e se a anon key
            tem permissão de leitura.
          </p>
        </div>
      ) : null}

      {programs.map((program) => {
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
          <ModuleCarousel
            key={program.id}
            title={program.name}
            subtitle={program.description ?? undefined}
            progressLabel={`${completedModules}/${totalModules}`}
            progressPercent={progressPercent}
            academyModules={program.modules}
            programSlug={program.slug}
            programName={program.name}
            isPremium={program.is_premium}
            moduleProgressMap={moduleProgressMap}
          />
        );
      })}
    </div>
  );
}
