import {
  getProgramBySlug,
  getPublishedPrograms,
  type ProgramWithModules,
} from "@/lib/academy-data";
import {
  createSupabaseReadServerClient,
  createSupabaseServiceServerClient,
} from "@/lib/supabase/server";

export type ModuleProgress = {
  moduleId: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
};

export type ModuleProgressMap = Record<
  string,
  {
    totalLessons: number;
    completedLessons: number;
    percentage: number;
  }
>;

type LessonProgressRow = {
  lesson_id: string;
  completed: boolean;
};

function calculateModuleProgress(
  lessonIds: string[],
  completedLessonIds: Set<string>,
): Omit<ModuleProgress, "moduleId"> {
  const totalLessons = lessonIds.length;

  if (totalLessons === 0) {
    return {
      totalLessons: 0,
      completedLessons: 0,
      percentage: 0,
    };
  }

  const completedLessons = lessonIds.filter((lessonId) =>
    completedLessonIds.has(lessonId),
  ).length;
  const percentage = Math.round((completedLessons / totalLessons) * 100);

  return {
    totalLessons,
    completedLessons,
    percentage,
  };
}

async function getLessonsGroupedByModule(
  moduleIds: string[],
): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();

  if (moduleIds.length === 0) {
    return grouped;
  }

  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return grouped;
  }

  const { data, error } = await supabase
    .from("lessons")
    .select("id, module_id")
    .in("module_id", moduleIds);

  if (error) {
    console.error(
      "[progress-data] Erro ao buscar aulas dos módulos:",
      error.message,
    );
    return grouped;
  }

  for (const lesson of data ?? []) {
    const moduleId = lesson.module_id as string;
    const lessonIds = grouped.get(moduleId) ?? [];
    lessonIds.push(lesson.id as string);
    grouped.set(moduleId, lessonIds);
  }

  return grouped;
}

export async function getLessonProgressForClient(
  clientId: string,
): Promise<string[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("client_id", clientId)
    .eq("completed", true);

  if (error) {
    console.error(
      "[progress-data] Erro ao buscar progresso do cliente:",
      error.message,
    );
    return [];
  }

  return ((data ?? []) as LessonProgressRow[]).map((row) => row.lesson_id);
}

export async function isLessonCompletedForClient(
  clientId: string,
  lessonId: string,
): Promise<boolean> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("client_id", clientId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) {
    console.error(
      "[progress-data] Erro ao verificar progresso da aula:",
      error.message,
    );
    return false;
  }

  return Boolean(data?.completed);
}

export async function getModuleProgressForClient(
  clientId: string,
  moduleId: string,
): Promise<ModuleProgress> {
  const [completedLessonIds, lessonsByModule] = await Promise.all([
    getLessonProgressForClient(clientId),
    getLessonsGroupedByModule([moduleId]),
  ]);

  const completedSet = new Set(completedLessonIds);
  const lessonIds = lessonsByModule.get(moduleId) ?? [];
  const progress = calculateModuleProgress(lessonIds, completedSet);

  return {
    moduleId,
    ...progress,
  };
}

export async function getProgramModuleProgressMap(
  clientId: string,
  programSlug?: string,
): Promise<ModuleProgressMap> {
  let programs: ProgramWithModules[] = [];

  if (programSlug) {
    const program = await getProgramBySlug(programSlug);

    if (program) {
      programs = [program];
    }
  } else {
    programs = await getPublishedPrograms();
  }

  const moduleIds = programs.flatMap((program) =>
    program ? program.modules.map((module) => module.id) : [],
  );

  const [completedLessonIds, lessonsByModule] = await Promise.all([
    getLessonProgressForClient(clientId),
    getLessonsGroupedByModule(moduleIds),
  ]);

  const completedSet = new Set(completedLessonIds);
  const progressMap: ModuleProgressMap = {};

  for (const moduleId of moduleIds) {
    const lessonIds = lessonsByModule.get(moduleId) ?? [];
    progressMap[moduleId] = calculateModuleProgress(lessonIds, completedSet);
  }

  return progressMap;
}

export async function toggleLessonCompleted(
  clientId: string,
  lessonId: string,
  completed: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return {
      success: false,
      error: "Supabase não configurado para salvar progresso.",
    };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      client_id: clientId,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? now : null,
      updated_at: now,
    },
    { onConflict: "client_id,lesson_id" },
  );

  if (error) {
    console.error(
      "[progress-data] Erro ao salvar progresso da aula:",
      error.message,
    );

    return {
      success: false,
      error: "Não foi possível salvar o progresso da aula.",
    };
  }

  return { success: true };
}

export function countCompletedModules(
  modules: Array<{ id: string }>,
  progressMap: ModuleProgressMap,
): number {
  return modules.filter((module) => progressMap[module.id]?.percentage === 100)
    .length;
}
