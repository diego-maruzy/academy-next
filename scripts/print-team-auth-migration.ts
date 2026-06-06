console.log(`Execute no Supabase → SQL Editor:

alter table public.team_members
add column if not exists password_hash text,
add column if not exists last_login_at timestamptz;

Arquivo: supabase/team-members-auth.sql`);
