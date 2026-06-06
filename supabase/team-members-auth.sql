-- Colunas de autenticação administrativa para team_members
-- Execute no SQL Editor do Supabase.

alter table public.team_members
add column if not exists password_hash text,
add column if not exists last_login_at timestamptz;
