-- Public read policies for the Academy student area.
-- Run this in the Supabase SQL editor if anon reads return empty results.

alter table public.programs enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;

drop policy if exists "Public can read published programs" on public.programs;
create policy "Public can read published programs"
on public.programs
for select
to anon
using (published = true);

drop policy if exists "Public can read modules from published programs" on public.modules;
create policy "Public can read modules from published programs"
on public.modules
for select
to anon
using (
  exists (
    select 1
    from public.programs
    where programs.id = modules.program_id
      and programs.published = true
  )
);

drop policy if exists "Public can read lessons from published programs" on public.lessons;
create policy "Public can read lessons from published programs"
on public.lessons
for select
to anon
using (
  exists (
    select 1
    from public.modules
    join public.programs on programs.id = modules.program_id
    where modules.id = lessons.module_id
      and programs.published = true
  )
);
