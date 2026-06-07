-- Senha padrão dos clientes da plataforma
-- Execute no SQL Editor do Supabase.

alter table public.clients
  add column if not exists default_password text not null default 'fliphouse2026';

update public.clients
set default_password = 'fliphouse2026'
where default_password is distinct from 'fliphouse2026';

notify pgrst, 'reload schema';
