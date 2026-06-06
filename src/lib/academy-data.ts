import {
  createSupabaseReadServerClient,
  formatSupabaseError,
} from "@/lib/supabase/server";
import type {
  Lesson,
  Module,
  ModuleWithLessons,
  Program,
  ProgramWithModules,
} from "@/types/academy";

const programColumns =
  "id, external_id, slug, name, description, published, display_order, is_premium, cover_image_url, created_at, updated_at";
const moduleColumns =
  "id, external_id, program_id, slug, name, description, display_order, cover_image_url, created_at, updated_at";
const lessonColumns =
  "id, external_id, module_id, slug, name, description, cta_url, cta_text, image_url, vimeo_url, display_order, created_at, updated_at";

function logAcademyDataError(context: string, error: unknown) {
  console.error(`[academy-data] ${context}`, formatSupabaseError(error));
}

async function getClient() {
  return createSupabaseReadServerClient();
}

async function attachModules(programs: Program[]) {
  const supabase = await getClient();

  if (!supabase || programs.length === 0) {
    return programs.map((program) => ({ ...program, modules: [] }));
  }

  const programIds = programs.map((program) => program.id);
  const { data, error } = await supabase
    .from("modules")
    .select(moduleColumns)
    .in("program_id", programIds)
    .order("display_order", { ascending: true });

  if (error) {
    logAcademyDataError("Failed to fetch modules for programs", error);
    return programs.map((program) => ({ ...program, modules: [] }));
  }

  const modules = (data ?? []) as Module[];

  return programs.map((program) => ({
    ...program,
    modules: modules.filter((moduleItem) => moduleItem.program_id === program.id),
  }));
}

export async function getPrograms(): Promise<ProgramWithModules[]> {
  const supabase = await getClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("programs")
    .select(programColumns)
    .order("display_order", { ascending: true });

  if (error) {
    logAcademyDataError("Failed to fetch programs", error);
    return [];
  }

  return attachModules((data ?? []) as Program[]);
}

export async function getPublishedPrograms(): Promise<ProgramWithModules[]> {
  const supabase = await getClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("programs")
    .select(programColumns)
    .eq("published", true)
    .order("display_order", { ascending: true });

  if (error) {
    logAcademyDataError("Failed to fetch published programs", error);
    return [];
  }

  return attachModules((data ?? []) as Program[]);
}

export async function getProgramBySlug(
  programSlug: string,
): Promise<ProgramWithModules | null> {
  const supabase = await getClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("programs")
    .select(programColumns)
    .eq("slug", programSlug)
    .maybeSingle();

  if (error) {
    logAcademyDataError(`Failed to fetch program by slug ${programSlug}`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  const [program] = await attachModules([data as Program]);
  return program;
}

export async function getProgramById(
  programId: string,
): Promise<ProgramWithModules | null> {
  const supabase = await getClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("programs")
    .select(programColumns)
    .eq("id", programId)
    .maybeSingle();

  if (error) {
    logAcademyDataError(`Failed to fetch program by id ${programId}`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  const [program] = await attachModules([data as Program]);
  return program;
}

export async function getModulesByProgramSlug(
  programSlug: string,
): Promise<Module[]> {
  const program = await getProgramBySlug(programSlug);
  return program?.modules ?? [];
}

export async function getModuleBySlug(
  programSlug: string,
  moduleSlug: string,
): Promise<ModuleWithLessons | null> {
  const supabase = await getClient();
  const program = await getProgramBySlug(programSlug);

  if (!supabase || !program) {
    return null;
  }

  const { data, error } = await supabase
    .from("modules")
    .select(moduleColumns)
    .eq("program_id", program.id)
    .eq("slug", moduleSlug)
    .maybeSingle();

  if (error) {
    logAcademyDataError(`Failed to fetch module by slug ${moduleSlug}`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  const lessons = await getLessonsByModuleId((data as Module).id);
  return { ...(data as Module), lessons };
}

export async function getModuleById(
  moduleId: string,
): Promise<ModuleWithLessons | null> {
  const supabase = await getClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("modules")
    .select(moduleColumns)
    .eq("id", moduleId)
    .maybeSingle();

  if (error) {
    logAcademyDataError(`Failed to fetch module by id ${moduleId}`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  const lessons = await getLessonsByModuleId((data as Module).id);
  return { ...(data as Module), lessons };
}

export async function getLessonsByModuleId(moduleId: string): Promise<Lesson[]> {
  const supabase = await getClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("lessons")
    .select(lessonColumns)
    .eq("module_id", moduleId)
    .order("display_order", { ascending: true });

  if (error) {
    logAcademyDataError(`Failed to fetch lessons for module ${moduleId}`, error);
    return [];
  }

  return (data ?? []) as Lesson[];
}

export async function getLessonBySlug(
  programSlug: string,
  moduleSlug: string,
  lessonSlug?: string,
) {
  const programModule = await getModuleBySlug(programSlug, moduleSlug);

  if (!programModule) {
    return null;
  }

  if (!lessonSlug) {
    return programModule.lessons[0] ?? null;
  }

  return programModule.lessons.find((lesson) => lesson.slug === lessonSlug) ?? null;
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const supabase = await getClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("lessons")
    .select(lessonColumns)
    .eq("id", lessonId)
    .maybeSingle();

  if (error) {
    logAcademyDataError(`Failed to fetch lesson by id ${lessonId}`, error);
    return null;
  }

  return (data as Lesson | null) ?? null;
}

export async function getFirstLessonFromModule(
  programSlug: string,
  moduleSlug: string,
) {
  const programModule = await getModuleBySlug(programSlug, moduleSlug);
  return programModule?.lessons[0] ?? null;
}

export async function getPreviousAndNextModule(
  programSlug: string,
  moduleSlug: string,
) {
  const modules = await getModulesByProgramSlug(programSlug);
  const currentIndex = modules.findIndex((module) => module.slug === moduleSlug);

  return {
    previousModule: currentIndex > 0 ? modules[currentIndex - 1] : null,
    nextModule:
      currentIndex >= 0 && currentIndex < modules.length - 1
        ? modules[currentIndex + 1]
        : null,
  };
}

export async function getProgramStats() {
  const supabase = await getClient();

  if (!supabase) {
    return {
      programsCount: 0,
      publishedProgramsCount: 0,
      modulesCount: 0,
      lessonsCount: 0,
    };
  }

  const [programsResult, publishedResult, modulesResult, lessonsResult] =
    await Promise.all([
      supabase.from("programs").select("id", { count: "exact", head: true }),
      supabase
        .from("programs")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabase.from("modules").select("id", { count: "exact", head: true }),
      supabase.from("lessons").select("id", { count: "exact", head: true }),
    ]);

  for (const result of [
    programsResult,
    publishedResult,
    modulesResult,
    lessonsResult,
  ]) {
    if (result.error) {
      logAcademyDataError("Failed to fetch program stats", result.error);
    }
  }

  return {
    programsCount: programsResult.count ?? 0,
    publishedProgramsCount: publishedResult.count ?? 0,
    modulesCount: modulesResult.count ?? 0,
    lessonsCount: lessonsResult.count ?? 0,
  };
}

export type { Lesson, Module, ModuleWithLessons, Program, ProgramWithModules };
