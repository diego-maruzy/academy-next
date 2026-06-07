-- Campos adicionais para importação de clientes (Keycloak / legado)
-- Execute no SQL Editor do Supabase após clients-team-webhooks.sql

alter table public.clients
  add column if not exists external_id text,
  add column if not exists country text,
  add column if not exists state text,
  add column if not exists city text,
  add column if not exists plan_id uuid,
  add column if not exists has_accessed boolean not null default false,
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists import_roles jsonb;

create unique index if not exists clients_external_id_idx
  on public.clients (external_id)
  where external_id is not null;

create index if not exists clients_plan_id_idx
  on public.clients (plan_id);

notify pgrst, 'reload schema';
