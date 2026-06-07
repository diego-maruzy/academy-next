-- Permite provider Supabase Storage nos Reels
-- Execute no SQL Editor do Supabase.

alter table public.academy_shorts
  drop constraint if exists academy_shorts_video_provider_check;

alter table public.academy_shorts
  alter column video_provider set default 'supabase';

alter table public.academy_shorts
  add constraint academy_shorts_video_provider_check
  check (video_provider in ('supabase', 'vimeo', 'youtube'));

notify pgrst, 'reload schema';
