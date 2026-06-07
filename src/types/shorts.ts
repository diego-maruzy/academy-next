export type VideoProvider = "supabase" | "vimeo" | "youtube";

export type AcademyShort = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  video_url: string;
  video_provider: VideoProvider;
  thumbnail_url: string | null;
  duration_label: string | null;
  cta_label: string | null;
  cta_url: string | null;
  published: boolean;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};
