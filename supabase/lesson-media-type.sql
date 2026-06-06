-- Tipo de mídia das aulas (vídeo ou imagem)
-- Execute no SQL Editor do Supabase.

alter table public.lessons
add column if not exists media_type text default 'video';

update public.lessons
set media_type = case
  when vimeo_url is not null and trim(vimeo_url) <> '' then 'video'
  when image_url is not null and trim(image_url) <> '' then 'image'
  else 'video'
end
where media_type is null or media_type = 'video';

alter table public.lessons
drop constraint if exists lessons_media_type_check;

alter table public.lessons
add constraint lessons_media_type_check
check (media_type in ('video', 'image'));

notify pgrst, 'reload schema';
