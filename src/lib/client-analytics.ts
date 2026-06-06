/**
 * Analytics do cliente na plataforma.
 * Área admin só deve visualizar analytics com permissão adequada.
 * Quando Keycloak estiver ativo, eventos virão da sessão autenticada do aluno.
 */

import { getPublishedPrograms } from "@/lib/academy-data";
import { createSupabaseReadServerClient } from "@/lib/supabase/server";
import type {
  AccessedProgramSummary,
  ClientAnalytics,
  CompletedProgramSummary,
  ProgramProgressSummary,
  RecentActivityItem,
  StudentEventType,
} from "@/types/client-analytics";

type ActivityEventRow = {
  id: string;
  client_id: string;
  program_id: string | null;
  module_id: string | null;
  lesson_id: string | null;
  event_type: StudentEventType;
  duration_seconds: number;
  created_at: string;
};

type LessonProgressRow = {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};

const ACCESS_EVENT_TYPES: StudentEventType[] = [
  "program_view",
  "module_view",
  "lesson_view",
  "lesson_completed",
];

const RECENT_EVENT_TYPES: StudentEventType[] = [
  "platform_access",
  "program_view",
  "module_view",
  "lesson_view",
  "lesson_completed",
];

function buildActivityDescription(
  eventType: StudentEventType,
  programName: string | null,
  moduleName: string | null,
  lessonName: string | null,
): string {
  switch (eventType) {
    case "platform_access":
      return "Acessou a plataforma";
    case "program_view":
      return programName
        ? `Acessou o programa ${programName}`
        : "Acessou um programa";
    case "module_view":
      return moduleName
        ? `Assistiu ${moduleName}`
        : "Assistiu um módulo";
    case "lesson_view":
      return lessonName
        ? `Assistiu ${lessonName}`
        : "Assistiu uma aula";
    case "lesson_completed":
      return lessonName
        ? `Concluiu a aula ${lessonName}`
        : "Concluiu uma aula";
    default:
      return "Atividade registrada";
  }
}

async function getLessonsByProgram(
  programIds: string[],
): Promise<Map<string, string[]>> {
  const lessonsByProgram = new Map<string, string[]>();

  if (programIds.length === 0) {
    return lessonsByProgram;
  }

  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return lessonsByProgram;
  }

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id, program_id")
    .in("program_id", programIds);

  if (modulesError || !modules?.length) {
    return lessonsByProgram;
  }

  const moduleIds = modules.map((module) => module.id as string);
  const moduleToProgram = new Map(
    modules.map((module) => [module.id as string, module.program_id as string]),
  );

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, module_id")
    .in("module_id", moduleIds);

  if (lessonsError) {
    return lessonsByProgram;
  }

  for (const lesson of lessons ?? []) {
    const moduleId = lesson.module_id as string;
    const programId = moduleToProgram.get(moduleId);

    if (!programId) {
      continue;
    }

    const lessonIds = lessonsByProgram.get(programId) ?? [];
    lessonIds.push(lesson.id as string);
    lessonsByProgram.set(programId, lessonIds);
  }

  return lessonsByProgram;
}

export async function getClientAnalytics(
  clientId: string,
): Promise<ClientAnalytics | null> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return null;
  }

  const [eventsResult, progressResult, clientResult, programs] =
    await Promise.all([
      supabase
        .from("student_activity_events")
        .select(
          "id, client_id, program_id, module_id, lesson_id, event_type, duration_seconds, created_at",
        )
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("lesson_progress")
        .select("lesson_id, completed, completed_at")
        .eq("client_id", clientId)
        .eq("completed", true),
      supabase
        .from("clients")
        .select("program_id")
        .eq("id", clientId)
        .maybeSingle(),
      getPublishedPrograms(),
    ]);

  if (eventsResult.error) {
    console.error(
      "[client-analytics] Erro ao buscar eventos:",
      eventsResult.error.message,
    );
  }

  const events = (eventsResult.data ?? []) as ActivityEventRow[];
  const completedProgress = (progressResult.data ?? []) as LessonProgressRow[];
  const linkedProgramId = (clientResult.data?.program_id as string | null) ?? null;

  const completedLessonIds = new Set(
    completedProgress.map((row) => row.lesson_id),
  );
  const completedLessonsCount = completedLessonIds.size;

  const lastAccessAt =
    events.length > 0
      ? events.reduce(
          (latest, event) =>
            event.created_at > latest ? event.created_at : latest,
          events[0].created_at,
        )
      : null;

  const totalTimeSeconds = events
    .filter((event) => event.event_type === "session_heartbeat")
    .reduce((sum, event) => sum + (event.duration_seconds ?? 0), 0);

  const programMap = new Map(
    programs.map((program) => [program.id, program]),
  );

  const eventAccessedProgramIds = new Set<string>();
  const programFirstAccess = new Map<string, string>();
  const programLastAccess = new Map<string, string>();

  for (const event of events) {
    if (!event.program_id || !ACCESS_EVENT_TYPES.includes(event.event_type)) {
      continue;
    }

    eventAccessedProgramIds.add(event.program_id);

    const currentFirst = programFirstAccess.get(event.program_id);
    if (!currentFirst || event.created_at < currentFirst) {
      programFirstAccess.set(event.program_id, event.created_at);
    }

    const currentLast = programLastAccess.get(event.program_id);
    if (!currentLast || event.created_at > currentLast) {
      programLastAccess.set(event.program_id, event.created_at);
    }
  }

  const progressProgramIds = new Set(eventAccessedProgramIds);
  if (linkedProgramId) {
    progressProgramIds.add(linkedProgramId);
  }

  const relevantProgramIds = [...progressProgramIds];
  const lessonsByProgram = await getLessonsByProgram(relevantProgramIds);

  const lessonToProgram = new Map<string, string>();
  for (const [programId, lessonIds] of lessonsByProgram.entries()) {
    for (const lessonId of lessonIds) {
      lessonToProgram.set(lessonId, programId);
    }
  }

  const programCompletedAt = new Map<string, string>();
  for (const row of completedProgress) {
    if (!row.completed_at) {
      continue;
    }

    const programId = lessonToProgram.get(row.lesson_id);
    if (!programId) {
      continue;
    }

    const current = programCompletedAt.get(programId);
    if (!current || row.completed_at > current) {
      programCompletedAt.set(programId, row.completed_at);
    }
  }

  const accessedPrograms: AccessedProgramSummary[] = [...eventAccessedProgramIds]
    .map((programId) => {
      const program = programMap.get(programId);
      const lastAccessAt = programLastAccess.get(programId);

      if (!program || !lastAccessAt) {
        return null;
      }

      return {
        id: program.id,
        name: program.name,
        slug: program.slug,
        firstAccessAt:
          programFirstAccess.get(programId) ?? lastAccessAt,
        lastAccessAt,
      };
    })
    .filter((item): item is AccessedProgramSummary => Boolean(item))
    .sort((a, b) => b.lastAccessAt.localeCompare(a.lastAccessAt));

  const completedPrograms: CompletedProgramSummary[] = [];

  for (const programId of progressProgramIds) {
    const program = programMap.get(programId);
    const lessonIds = lessonsByProgram.get(programId) ?? [];

    if (!program || lessonIds.length === 0) {
      continue;
    }

    const allCompleted = lessonIds.every((lessonId) =>
      completedLessonIds.has(lessonId),
    );

    if (!allCompleted) {
      continue;
    }

    completedPrograms.push({
      id: program.id,
      name: program.name,
      slug: program.slug,
      completedAt: programCompletedAt.get(programId) ?? null,
    });
  }

  completedPrograms.sort((a, b) =>
    (b.completedAt ?? "").localeCompare(a.completedAt ?? ""),
  );

  const programProgress: ProgramProgressSummary[] = relevantProgramIds
    .map((programId) => {
      const program = programMap.get(programId);
      if (!program) {
        return null;
      }

      const lessonIds = lessonsByProgram.get(programId) ?? [];
      const totalLessons = lessonIds.length;
      const completedLessons = lessonIds.filter((lessonId) =>
        completedLessonIds.has(lessonId),
      ).length;
      const percentage =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      let status: ProgramProgressSummary["status"] = "not_started";
      if (totalLessons > 0 && completedLessons === totalLessons) {
        status = "completed";
      } else if (completedLessons > 0) {
        status = "in_progress";
      }

      return {
        programId: program.id,
        programName: program.name,
        programSlug: program.slug,
        totalLessons,
        completedLessons,
        percentage,
        lastAccessAt: programLastAccess.get(programId) ?? null,
        status,
      };
    })
    .filter((item): item is ProgramProgressSummary => Boolean(item))
    .sort((a, b) =>
      (b.lastAccessAt ?? "").localeCompare(a.lastAccessAt ?? ""),
    );

  const recentEvents = events
    .filter((event) => RECENT_EVENT_TYPES.includes(event.event_type))
    .slice(0, 10);

  const moduleIds = [
    ...new Set(recentEvents.map((event) => event.module_id).filter(Boolean)),
  ] as string[];
  const lessonIds = [
    ...new Set(recentEvents.map((event) => event.lesson_id).filter(Boolean)),
  ] as string[];

  const [moduleRows, lessonRows] = await Promise.all([
    moduleIds.length
      ? supabase.from("modules").select("id, name").in("id", moduleIds)
      : Promise.resolve({ data: [], error: null }),
    lessonIds.length
      ? supabase.from("lessons").select("id, name").in("id", lessonIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const moduleNameMap = new Map(
    (moduleRows.data ?? []).map((row) => [row.id as string, row.name as string]),
  );
  const lessonNameMap = new Map(
    (lessonRows.data ?? []).map((row) => [row.id as string, row.name as string]),
  );

  const recentActivity: RecentActivityItem[] = recentEvents.map((event) => {
    const programName = event.program_id
      ? (programMap.get(event.program_id)?.name ?? null)
      : null;
    const moduleName = event.module_id
      ? (moduleNameMap.get(event.module_id) ?? null)
      : null;
    const lessonName = event.lesson_id
      ? (lessonNameMap.get(event.lesson_id) ?? null)
      : null;

    return {
      id: event.id,
      eventType: event.event_type,
      description: buildActivityDescription(
        event.event_type,
        programName,
        moduleName,
        lessonName,
      ),
      createdAt: event.created_at,
      programName,
      moduleName,
      lessonName,
    };
  });

  return {
    totalTimeSeconds,
    lastAccessAt,
    completedLessonsCount,
    accessedPrograms,
    completedPrograms,
    programProgress,
    recentActivity,
  };
}
