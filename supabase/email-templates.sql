-- Templates de e-mail pós-pagamento
-- Execute no SQL Editor do Supabase.

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  billing_type text not null,
  template_type text not null,
  enabled boolean default true,
  subject text not null,
  html_body text not null,
  team_recipients text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (billing_type, template_type)
);

create table if not exists public.email_send_logs (
  id uuid primary key default gen_random_uuid(),
  billing_type text,
  template_type text,
  recipient text not null,
  subject text,
  status text not null,
  error_message text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists email_send_logs_created_at_idx
  on public.email_send_logs (created_at desc);

create index if not exists email_send_logs_billing_type_idx
  on public.email_send_logs (billing_type);

create index if not exists email_send_logs_template_type_idx
  on public.email_send_logs (template_type);

create index if not exists email_templates_billing_type_idx
  on public.email_templates (billing_type);

alter table public.email_templates enable row level security;
alter table public.email_send_logs enable row level security;

drop policy if exists "Service role full access email_templates" on public.email_templates;
create policy "Service role full access email_templates"
on public.email_templates
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role full access email_send_logs" on public.email_send_logs;
create policy "Service role full access email_send_logs"
on public.email_send_logs
for all
to service_role
using (true)
with check (true);

-- HTML base escuro e responsivo
insert into public.email_templates (billing_type, template_type, subject, html_body, team_recipients)
values
(
  'PREMIUM_MONTH',
  'customer',
  'Compra confirmada — Acesso liberado à Checkmate Property',
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Compra confirmada</title></head><body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;"><tr><td style="padding:28px 28px 12px;background:linear-gradient(94deg,#53bc76 0%,#39aff2 100%);"><p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Checkmate Property</p><h1 style="margin:12px 0 0;font-size:24px;color:#fff;">Compra confirmada</h1></td></tr><tr><td style="padding:28px;"><p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Olá <strong>{{name}}</strong>,</p><p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">Seu acesso ao <strong>{{planLabel}}</strong> foi liberado com sucesso.</p><table role="presentation" width="100%" style="margin:20px 0;background:#0b1220;border-radius:14px;border:1px solid rgba(255,255,255,0.06);"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.8;"><div><strong>Plano:</strong> {{plan}}</div><div><strong>Valor:</strong> {{price}}</div><div><strong>E-mail:</strong> {{email}}</div><div><strong>Telefone:</strong> {{phone}}</div><div><strong>Cupom:</strong> {{coupon}}</div></td></tr></table><p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">Acesse a plataforma com o e-mail cadastrado.</p></td></tr></table></td></tr></table></body></html>',
  '{}'
),
(
  'PREMIUM_MONTH',
  'team',
  'Compra plano mensal - {{name}}',
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:20px;"><tr><td style="padding:28px;"><h1 style="margin:0 0 12px;font-size:22px;color:#fff;">Nova assinatura mensal</h1><p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">Um novo cliente assinou o plano mensal.</p><table role="presentation" width="100%" style="background:#0b1220;border-radius:14px;border:1px solid rgba(255,255,255,0.06);"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.8;"><div><strong>Nome:</strong> {{name}}</div><div><strong>E-mail:</strong> {{email}}</div><div><strong>Telefone:</strong> {{phone}}</div><div><strong>Plano:</strong> {{plan}}</div><div><strong>Valor:</strong> {{price}}</div><div><strong>Cupom:</strong> {{coupon}}</div></td></tr></table></td></tr></table></td></tr></table></body></html>',
  '{}'
),
(
  'PREMIUM_YEAR',
  'customer',
  'Bem-vindo(a) à Checkmate Property — Plano Anual',
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;"><tr><td style="padding:28px 28px 12px;background:linear-gradient(94deg,#53bc76 0%,#39aff2 100%);"><p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Checkmate Property</p><h1 style="margin:12px 0 0;font-size:24px;color:#fff;">Bem-vindo(a) ao plano anual</h1></td></tr><tr><td style="padding:28px;"><p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Olá <strong>{{name}}</strong>,</p><p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">Sua assinatura anual da Checkmate Property está ativa.</p><table role="presentation" width="100%" style="margin:20px 0;background:#0b1220;border-radius:14px;border:1px solid rgba(255,255,255,0.06);"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.8;"><div><strong>Plano:</strong> {{plan}}</div><div><strong>Valor:</strong> {{price}}</div><div><strong>E-mail:</strong> {{email}}</div><div><strong>Telefone:</strong> {{phone}}</div><div><strong>Cupom:</strong> {{coupon}}</div></td></tr></table></td></tr></table></td></tr></table></body></html>',
  '{}'
),
(
  'PREMIUM_YEAR',
  'team',
  'Compra plano anual - {{name}}',
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:20px;"><tr><td style="padding:28px;"><h1 style="margin:0 0 12px;font-size:22px;color:#fff;">Nova assinatura anual</h1><p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">Um novo cliente assinou o plano anual.</p><table role="presentation" width="100%" style="background:#0b1220;border-radius:14px;border:1px solid rgba(255,255,255,0.06);"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.8;"><div><strong>Nome:</strong> {{name}}</div><div><strong>E-mail:</strong> {{email}}</div><div><strong>Telefone:</strong> {{phone}}</div><div><strong>Plano:</strong> {{plan}}</div><div><strong>Valor:</strong> {{price}}</div><div><strong>Cupom:</strong> {{coupon}}</div></td></tr></table></td></tr></table></td></tr></table></body></html>',
  '{}'
)
on conflict (billing_type, template_type) do nothing;

notify pgrst, 'reload schema';
