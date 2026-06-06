-- Link de upgrade para programas premium
-- Execute no SQL Editor do Supabase.

alter table public.programs
add column if not exists upgrade_url text;

notify pgrst, 'reload schema';
