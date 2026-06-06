-- Tabela de eventos de webhook (caso clients e webhook_connections já existam).
-- Execute no SQL Editor do Supabase se o dashboard reportar ausência de webhook_events.

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  webhook_connection_id uuid references webhook_connections(id) on delete set null,
  status text not null,
  payload jsonb,
  error_message text,
  created_client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists webhook_events_connection_id_idx
  on webhook_events (webhook_connection_id);

create index if not exists webhook_events_created_at_idx
  on webhook_events (created_at desc);
