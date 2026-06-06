export type LessonMediaType = "video" | "image";

export type Lesson = {
  id: string;
  external_id: string;
  module_id: string;
  name: string;
  slug: string;
  description: string | null;
  cta_url: string | null;
  cta_text: string | null;
  image_url: string | null;
  vimeo_url: string | null;
  media_type: LessonMediaType;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Module = {
  id: string;
  external_id: string;
  program_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Program = {
  id: string;
  external_id: string;
  slug: string;
  name: string;
  description: string | null;
  published: boolean;
  display_order: number;
  is_premium: boolean;
  upgrade_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgramWithModules = Program & {
  modules: Module[];
};

export type ModuleWithLessons = Module & {
  lessons: Lesson[];
};
