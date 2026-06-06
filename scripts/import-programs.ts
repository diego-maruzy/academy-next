import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import programsJson from "../src/data/programas.json" assert { type: "json" };

config({ path: ".env.local" });

type LovableLesson = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  cta_url: string | null;
  cta_text: string | null;
  image_url: string | null;
  vimeo_url: string | null;
  display_order: number;
};

type LovableModule = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  lessons: LovableLesson[];
  display_order: number;
  cover_image_url: string | null;
};

type LovableProgram = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  published: boolean;
  display_order: number;
  is_premium: boolean;
  cover_image_url: string | null;
  modules: LovableModule[];
};

type ImportCounters = {
  programs: number;
  modules: number;
  lessons: number;
  errors: number;
};

type SupabaseRecord = {
  id: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(1);
}

if (
  supabaseUrl === "SUA_URL_DO_SUPABASE" ||
  serviceRoleKey === "SUA_SERVICE_ROLE_KEY"
) {
  console.error(
    "Replace Supabase placeholders in .env.local before running the import.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const programs = programsJson as unknown as LovableProgram[];
const counters: ImportCounters = {
  programs: 0,
  modules: 0,
  lessons: 0,
  errors: 0,
};

function sortByDisplayOrder<T extends { display_order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.display_order - b.display_order);
}

function logItemError(type: string, name: string, error: unknown) {
  counters.errors += 1;
  console.error(`[${type}] ${name}:`, error);
}

async function upsertProgram(program: LovableProgram) {
  const { data, error } = await supabase
    .from("programs")
    .upsert(
      {
        external_id: program.id,
        slug: program.slug,
        name: program.name,
        description: program.description,
        published: program.published,
        display_order: program.display_order,
        is_premium: program.is_premium,
        cover_image_url: program.cover_image_url,
      },
      { onConflict: "external_id" },
    )
    .select("id")
    .single<SupabaseRecord>();

  if (error) {
    throw error;
  }

  counters.programs += 1;
  return data.id;
}

async function upsertModule(programId: string, programModule: LovableModule) {
  const { data, error } = await supabase
    .from("modules")
    .upsert(
      {
        external_id: programModule.id,
        program_id: programId,
        slug: programModule.slug,
        name: programModule.name,
        description: programModule.description ?? null,
        display_order: programModule.display_order,
        cover_image_url: programModule.cover_image_url,
      },
      { onConflict: "external_id" },
    )
    .select("id")
    .single<SupabaseRecord>();

  if (error) {
    throw error;
  }

  counters.modules += 1;
  return data.id;
}

async function upsertLesson(moduleId: string, lesson: LovableLesson) {
  const { error } = await supabase.from("lessons").upsert(
    {
      external_id: lesson.id,
      module_id: moduleId,
      slug: lesson.slug,
      name: lesson.name,
      description: lesson.description ?? null,
      cta_url: lesson.cta_url,
      cta_text: lesson.cta_text,
      image_url: lesson.image_url,
      vimeo_url: lesson.vimeo_url,
      display_order: lesson.display_order,
    },
    { onConflict: "external_id" },
  );

  if (error) {
    throw error;
  }

  counters.lessons += 1;
}

async function importPrograms() {
  console.info(`Starting import of ${programs.length} programs...`);

  for (const program of sortByDisplayOrder(programs)) {
    let programId: string;

    try {
      programId = await upsertProgram(program);
    } catch (error) {
      logItemError("program", program.name, error);
      continue;
    }

    for (const programModule of sortByDisplayOrder(program.modules)) {
      let moduleId: string;

      try {
        moduleId = await upsertModule(programId, programModule);
      } catch (error) {
        logItemError("module", `${program.name} > ${programModule.name}`, error);
        continue;
      }

      for (const lesson of sortByDisplayOrder(programModule.lessons)) {
        try {
          await upsertLesson(moduleId, lesson);
        } catch (error) {
          logItemError(
            "lesson",
            `${program.name} > ${programModule.name} > ${lesson.name}`,
            error,
          );
        }
      }
    }
  }

  console.info("Import finished.");
  console.info(`Programs imported: ${counters.programs}`);
  console.info(`Modules imported: ${counters.modules}`);
  console.info(`Lessons imported: ${counters.lessons}`);
  console.info(`Errors: ${counters.errors}`);
}

importPrograms().catch((error) => {
  console.error("Unexpected import failure:", error);
  process.exit(1);
});
