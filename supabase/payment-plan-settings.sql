-- Configurações dos planos de pagamento públicos
-- Execute no SQL Editor do Supabase.

create table if not exists public.payment_plan_settings (
  id uuid primary key default gen_random_uuid(),
  billing_type text unique not null,
  plan_name text not null,
  price_label text not null,
  compare_price_label text,
  discount_label text,
  price_id text not null,
  public_path text not null,
  api_endpoint text not null,
  redirect_url text,
  webhook_1_url text,
  webhook_2_url text,
  show_coupon_field boolean default false,
  default_coupon text,
  default_password text default 'fliphouse2026',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payment_plan_settings enable row level security;

drop policy if exists "Public can read active payment plans" on public.payment_plan_settings;
create policy "Public can read active payment plans"
on public.payment_plan_settings
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Service role full access payment_plan_settings" on public.payment_plan_settings;
create policy "Service role full access payment_plan_settings"
on public.payment_plan_settings
for all
to service_role
using (true)
with check (true);

insert into public.payment_plan_settings (
  billing_type,
  plan_name,
  price_label,
  price_id,
  public_path,
  api_endpoint,
  redirect_url,
  default_password,
  default_coupon,
  show_coupon_field
) values
(
  'PREMIUM_MONTH',
  'Plano Mensal',
  '$89.00/mês',
  'price_1MtweJIOSU7dsJH9ZsLGvC8n',
  '/pay/month',
  'https://api.checkmateproperty.com/api/auth/register/premium',
  'https://checkmateproperty.com/pay-obrigado/',
  'fliphouse2026',
  'FLIP10',
  true
),
(
  'PREMIUM_YEAR',
  'Plano Anual',
  '$961.00/ano',
  'price_1MtweJIOSU7dsJH9EnwDsDC3',
  '/pay/year',
  'https://api.checkmateproperty.com/api/auth/register/premium',
  'https://checkmateproperty.com/pay-obrigado/',
  'fliphouse2026',
  'FLIP10',
  true
)
on conflict (billing_type) do update set
  plan_name = excluded.plan_name,
  price_label = excluded.price_label,
  price_id = excluded.price_id,
  public_path = excluded.public_path,
  api_endpoint = excluded.api_endpoint,
  redirect_url = excluded.redirect_url,
  default_password = excluded.default_password,
  default_coupon = excluded.default_coupon,
  show_coupon_field = excluded.show_coupon_field,
  updated_at = now();

update public.payment_plan_settings
set
  compare_price_label = '$1,068.00/ano',
  discount_label = '10% OFF'
where billing_type = 'PREMIUM_YEAR';
