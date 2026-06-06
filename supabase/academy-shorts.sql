-- Shorts verticais da Academy
-- Execute no SQL Editor do Supabase.

create table if not exists public.academy_shorts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  category text,
  video_url text not null,
  video_provider text not null default 'vimeo',
  thumbnail_url text,
  duration_label text,
  cta_label text,
  cta_url text,
  published boolean default true,
  featured boolean default false,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint academy_shorts_video_provider_check
    check (video_provider in ('vimeo', 'youtube'))
);

create index if not exists idx_academy_shorts_slug
  on public.academy_shorts (slug);

create index if not exists idx_academy_shorts_published
  on public.academy_shorts (published);

create index if not exists idx_academy_shorts_display_order
  on public.academy_shorts (display_order);

create index if not exists idx_academy_shorts_created_at
  on public.academy_shorts (created_at);

alter table public.academy_shorts enable row level security;

drop policy if exists "Public can read published shorts" on public.academy_shorts;
create policy "Public can read published shorts"
on public.academy_shorts
for select
to anon, authenticated
using (published = true);

drop policy if exists "Service role full access academy_shorts" on public.academy_shorts;
create policy "Service role full access academy_shorts"
on public.academy_shorts
for all
to service_role
using (true)
with check (true);

insert into public.academy_shorts (
  title,
  slug,
  description,
  category,
  video_url,
  video_provider,
  duration_label,
  cta_label,
  cta_url,
  published,
  featured,
  display_order
) values
(
  'Como analisar um deal em 60 segundos',
  'como-analisar-um-deal-em-60-segundos',
  'Entenda rapidamente o que observar antes de entrar em um projeto.',
  'Deal Analysis',
  'https://vimeo.com/76979871',
  'vimeo',
  '00:59',
  'Ver programa completo',
  '/programas',
  true,
  true,
  0
)
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
