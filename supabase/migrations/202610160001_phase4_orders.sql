create extension if not exists pgcrypto;

create table public.orders (
  id uuid primary key,
  reference text not null unique,
  payment_status text not null default 'pending_payment'
    check (payment_status in ('pending_payment', 'paid', 'payment_failed', 'expired')),
  verification_status text not null
    check (verification_status in ('not_required', 'pending', 'approved', 'rejected')),
  customer jsonb not null,
  delivery_address jsonb not null,
  billing_address jsonb not null,
  configuration jsonb not null,
  price_breakdown jsonb not null,
  quantity integer not null check (quantity between 1 and 20),
  subtotal_pence integer not null check (subtotal_pence >= 0),
  delivery_pence integer not null default 0 check (delivery_pence >= 0),
  total_pence integer not null check (total_pence >= 0),
  currency text not null default 'gbp' check (currency = 'gbp'),
  special_instructions text not null default '',
  order_notes text not null default '',
  additional_notes text not null default '',
  checkout_access_token_hash text not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_files (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('v5c', 'artwork')),
  bucket text not null check (bucket in ('v5c-documents', 'order-artwork')),
  object_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  status text not null default 'open'
    check (status in ('open', 'complete', 'failed', 'expired')),
  amount_pence integer not null check (amount_pence >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index orders_payment_created_idx on public.orders (payment_status, created_at desc);
create index orders_verification_created_idx on public.orders (verification_status, created_at desc);
create index order_files_order_created_idx on public.order_files (order_id, created_at);
create index payment_attempts_order_created_idx on public.payment_attempts (order_id, created_at desc);

create or replace function public.register_payment_attempt(
  p_order_id uuid,
  p_session_id text,
  p_amount_pence integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.payment_attempts (
    order_id,
    stripe_checkout_session_id,
    amount_pence
  ) values (
    p_order_id,
    p_session_id,
    p_amount_pence
  );

  update public.orders
  set stripe_checkout_session_id = p_session_id, updated_at = now()
  where id = p_order_id and payment_status <> 'paid';
end;
$$;

create or replace function public.apply_stripe_event(
  p_event_id text,
  p_event_type text,
  p_session_id text,
  p_payment_status text,
  p_attempt_status text,
  p_payment_intent_id text,
  p_paid_at timestamptz
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stripe_events (event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;

  if not found then
    return false;
  end if;

  update public.payment_attempts
  set status = p_attempt_status, updated_at = now()
  where stripe_checkout_session_id = p_session_id;

  update public.orders
  set
    payment_status = case when payment_status = 'paid' then payment_status else p_payment_status end,
    stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
    paid_at = case when p_payment_status = 'paid' then coalesce(p_paid_at, now()) else paid_at end,
    updated_at = now()
  where id = (
    select order_id
    from public.payment_attempts
    where stripe_checkout_session_id = p_session_id
  );

  update public.stripe_events
  set processed_at = now()
  where event_id = p_event_id;

  return true;
end;
$$;

alter table public.orders enable row level security;
alter table public.order_files enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.stripe_events enable row level security;

revoke all on public.orders from anon, authenticated;
revoke all on public.order_files from anon, authenticated;
revoke all on public.payment_attempts from anon, authenticated;
revoke all on public.stripe_events from anon, authenticated;
revoke all on function public.register_payment_attempt(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.apply_stripe_event(text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.register_payment_attempt(uuid, text, integer) to service_role;
grant execute on function public.apply_stripe_event(text, text, text, text, text, text, timestamptz) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'v5c-documents',
  'v5c-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-artwork',
  'order-artwork',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
