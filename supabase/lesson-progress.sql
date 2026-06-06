-- Progresso do aluno por aula
-- Execute no SQL Editor do Supabase.

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(client_id, lesson_id)
);

create index if not exists idx_lesson_progress_client_id
  on public.lesson_progress(client_id);

create index if not exists idx_lesson_progress_lesson_id
  on public.lesson_progress(lesson_id);

alter table public.lesson_progress enable row level security;

drop policy if exists "Service role full access lesson_progress" on public.lesson_progress;
create policy "Service role full access lesson_progress"
on public.lesson_progress
for all
to service_role
using (true)
with check (true);

drop policy if exists "Public can read lesson progress" on public.lesson_progress;
create policy "Public can read lesson progress"
on public.lesson_progress
for select
to anon, authenticated
using (true);
