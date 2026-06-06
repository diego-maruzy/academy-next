-- Eventos de atividade do aluno na plataforma
-- Execute no SQL Editor do Supabase.

create table if not exists public.student_activity_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  module_id uuid references public.modules(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  event_type text not null,
  duration_seconds integer default 0,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_student_activity_client_id
  on public.student_activity_events(client_id);

create index if not exists idx_student_activity_program_id
  on public.student_activity_events(program_id);

create index if not exists idx_student_activity_module_id
  on public.student_activity_events(module_id);

create index if not exists idx_student_activity_lesson_id
  on public.student_activity_events(lesson_id);

create index if not exists idx_student_activity_event_type
  on public.student_activity_events(event_type);

create index if not exists idx_student_activity_created_at
  on public.student_activity_events(created_at);

alter table public.student_activity_events enable row level security;

drop policy if exists "Service role full access student_activity_events" on public.student_activity_events;
create policy "Service role full access student_activity_events"
on public.student_activity_events
for all
to service_role
using (true)
with check (true);

notify pgrst, 'reload schema';
