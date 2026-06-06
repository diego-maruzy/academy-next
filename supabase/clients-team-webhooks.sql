-- Migration: Clientes, Equipe e Conexões/Webhooks
-- Execute no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  keycloak_id text unique,
  full_name text not null,
  email text unique not null,
  phone text,
  role text not null default 'ROLE_USER_FREE',
  status text not null default 'active',
  source text,
  program_id uuid references programs(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  keycloak_id text unique,
  full_name text not null,
  email text unique not null,
  phone text,
  role text not null default 'support',
  permission text not null default 'academy_access',
  department text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists webhook_connections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  type text not null default 'jetformbuilder',
  role text not null default 'ROLE_USER_FREE',
  program_id uuid references programs(id) on delete set null,
  status text not null default 'active',
  secret_token text,
  total_events integer not null default 0,
  success_events integer not null default 0,
  error_events integer not null default 0,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  webhook_connection_id uuid references webhook_connections(id) on delete set null,
  status text not null,
  payload jsonb,
  error_message text,
  created_client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists clients_email_idx on clients (email);
create index if not exists clients_program_id_idx on clients (program_id);
create index if not exists team_members_email_idx on team_members (email);
create index if not exists webhook_connections_slug_idx on webhook_connections (slug);
create index if not exists webhook_events_connection_id_idx on webhook_events (webhook_connection_id);

-- Seed opcional para testar o webhook lead-free via curl.
-- insert into webhook_connections (name, slug, description, type, role, status, secret_token)
-- values (
--   'Lead Free',
--   'lead-free',
--   'Webhook de teste para leads gratuitos',
--   'jetformbuilder',
--   'ROLE_USER_FREE',
--   'active',
--   encode(gen_random_bytes(32), 'hex')
-- )
-- on conflict (slug) do nothing;
