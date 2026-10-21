create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'admin' check (role in ('owner', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column fulfilment_status text not null default 'new'
    check (fulfilment_status in ('new', 'in_production', 'dispatched', 'cancelled')),
  add column carrier text not null default '',
  add column tracking_reference text not null default '',
  add column dispatched_at timestamptz,
  add column cancelled_at timestamptz,
  add column cancellation_reason text not null default '',
  add column cancelled_by uuid references auth.users(id) on delete set null;

create table public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  title text not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default 'System',
  previous_value jsonb,
  next_value jsonb,
  source_key text unique,
  created_at timestamptz not null default now()
);

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  order_reference text not null default '' check (char_length(order_reference) <= 64),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create table public.pending_order_uploads (
  id uuid primary key default gen_random_uuid(),
  session_hash text not null,
  cart_item_id text not null check (cart_item_id ~ '^[A-Za-z0-9-]{1,64}$'),
  kind text not null check (kind in ('v5c', 'artwork')),
  bucket text not null check (bucket in ('v5c-documents', 'order-artwork')),
  object_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  claimed_at timestamptz,
  order_id uuid references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (
    (kind = 'v5c' and bucket = 'v5c-documents') or
    (kind = 'artwork' and bucket = 'order-artwork')
  ),
  check ((claimed_at is null and order_id is null and order_item_id is null) or
         (claimed_at is not null and order_id is not null and order_item_id is not null))
);

create table public.api_rate_limits (
  scope text not null,
  identifier_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 1),
  primary key (scope, identifier_hash)
);

create index orders_fulfilment_created_idx on public.orders (fulfilment_status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create index orders_lower_reference_idx on public.orders (lower(reference));
create index order_notes_order_created_idx on public.order_notes (order_id, created_at desc);
create index order_events_order_created_idx on public.order_events (order_id, created_at desc);
create index contact_submissions_status_created_idx on public.contact_submissions (status, created_at desc);
create index pending_order_uploads_session_expiry_idx on public.pending_order_uploads (session_hash, expires_at);
create index pending_order_uploads_expired_idx on public.pending_order_uploads (expires_at) where claimed_at is null;
create index api_rate_limits_window_idx on public.api_rate_limits (window_started_at);

insert into public.order_events (order_id, event_type, title, actor_name, source_key, created_at)
select id, 'order_created', 'Order placed', 'System', 'order-created:' || id::text, created_at
from public.orders
on conflict (source_key) do nothing;

create or replace function public.check_api_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_window_seconds integer,
  p_max_requests integer
) returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.api_rate_limits%rowtype;
begin
  if p_window_seconds < 1 or p_max_requests < 1 then
    raise exception 'Invalid rate-limit configuration';
  end if;

  insert into public.api_rate_limits (scope, identifier_hash, window_started_at, request_count)
  values (p_scope, p_identifier_hash, v_now, 1)
  on conflict (scope, identifier_hash) do update
  set
    window_started_at = case
      when public.api_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now then v_now
      else public.api_rate_limits.window_started_at
    end,
    request_count = case
      when public.api_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now then 1
      else public.api_rate_limits.request_count + 1
    end
  returning * into v_row;

  allowed := v_row.request_count <= p_max_requests;
  retry_after_seconds := case when allowed then 0 else greatest(
    1,
    ceil(extract(epoch from (v_row.window_started_at + make_interval(secs => p_window_seconds) - v_now)))::integer
  ) end;
  return next;
end;
$$;

create or replace function public.claim_pending_order_upload(
  p_upload_id uuid,
  p_session_hash text,
  p_order_id uuid,
  p_order_item_id uuid
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.pending_order_uploads
  set claimed_at = now(), order_id = p_order_id, order_item_id = p_order_item_id
  where id = p_upload_id
    and session_hash = p_session_hash
    and claimed_at is null
    and expires_at > now();
  return found;
end;
$$;

create or replace function public.admin_set_fulfilment(
  p_order_id uuid,
  p_status text,
  p_actor_id uuid,
  p_actor_name text,
  p_carrier text default '',
  p_tracking_reference text default '',
  p_cancellation_reason text default ''
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_previous text;
begin
  select fulfilment_status into v_previous from public.orders where id = p_order_id for update;
  if not found then return false; end if;
  if v_previous = 'cancelled' then raise exception 'Cancelled orders cannot be changed'; end if;
  if p_status = 'cancelled' and (v_previous not in ('new', 'in_production') or char_length(trim(p_cancellation_reason)) < 3) then
    raise exception 'Cancellation is not allowed';
  end if;
  if p_status = 'dispatched' and (char_length(trim(p_carrier)) = 0 or char_length(trim(p_tracking_reference)) = 0) then
    raise exception 'Carrier and tracking reference are required';
  end if;
  if not (
    (v_previous = 'new' and p_status in ('new', 'in_production', 'cancelled')) or
    (v_previous = 'in_production' and p_status in ('in_production', 'dispatched', 'cancelled')) or
    (v_previous = 'dispatched' and p_status = 'dispatched')
  ) then raise exception 'Invalid fulfilment transition'; end if;

  update public.orders set
    fulfilment_status = p_status,
    carrier = case when p_status = 'dispatched' then trim(p_carrier) else carrier end,
    tracking_reference = case when p_status = 'dispatched' then trim(p_tracking_reference) else tracking_reference end,
    dispatched_at = case when p_status = 'dispatched' then coalesce(dispatched_at, now()) else dispatched_at end,
    cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
    cancellation_reason = case when p_status = 'cancelled' then trim(p_cancellation_reason) else cancellation_reason end,
    cancelled_by = case when p_status = 'cancelled' then p_actor_id else cancelled_by end,
    updated_at = now()
  where id = p_order_id;

  if v_previous <> p_status then
    insert into public.order_events (order_id, event_type, title, actor_id, actor_name, previous_value, next_value)
    values (p_order_id, 'fulfilment_updated', 'Fulfilment status updated', p_actor_id, p_actor_name,
      jsonb_build_object('status', v_previous), jsonb_build_object('status', p_status));
  end if;
  return true;
end;
$$;

create or replace function public.admin_set_verification(
  p_order_id uuid,
  p_status text,
  p_actor_id uuid,
  p_actor_name text
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_previous text;
begin
  if p_status not in ('not_required', 'pending', 'approved', 'rejected') then
    raise exception 'Invalid verification status';
  end if;
  select verification_status into v_previous from public.orders where id = p_order_id for update;
  if not found then return false; end if;
  update public.orders set verification_status = p_status, updated_at = now() where id = p_order_id;
  if v_previous <> p_status then
    insert into public.order_events (order_id, event_type, title, actor_id, actor_name, previous_value, next_value)
    values (p_order_id, 'verification_updated', 'Verification status updated', p_actor_id, p_actor_name,
      jsonb_build_object('status', v_previous), jsonb_build_object('status', p_status));
  end if;
  return true;
end;
$$;

create or replace function public.admin_add_order_note(
  p_order_id uuid,
  p_actor_id uuid,
  p_actor_name text,
  p_body text
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if char_length(trim(p_body)) < 1 or char_length(trim(p_body)) > 1000 then
    raise exception 'Invalid note';
  end if;
  insert into public.order_notes (order_id, author_id, author_name, body)
  values (p_order_id, p_actor_id, p_actor_name, trim(p_body)) returning id into v_id;
  insert into public.order_events (order_id, event_type, title, actor_id, actor_name)
  values (p_order_id, 'note_added', 'Private note added', p_actor_id, p_actor_name);
  return v_id;
end;
$$;

create or replace function public.register_payment_attempt(
  p_order_id uuid,
  p_session_id text,
  p_amount_pence integer
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.payment_attempts (order_id, stripe_checkout_session_id, amount_pence)
  values (p_order_id, p_session_id, p_amount_pence);
  update public.orders set stripe_checkout_session_id = p_session_id, updated_at = now()
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
security invoker
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  insert into public.stripe_events (event_id, event_type) values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;
  if not found then return false; end if;

  update public.payment_attempts set status = p_attempt_status, updated_at = now()
  where stripe_checkout_session_id = p_session_id returning order_id into v_order_id;

  if v_order_id is not null then
    update public.orders set
      payment_status = case when payment_status = 'paid' then payment_status else p_payment_status end,
      stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
      paid_at = case when p_payment_status = 'paid' then coalesce(p_paid_at, now()) else paid_at end,
      updated_at = now()
    where id = v_order_id;
    insert into public.order_events (order_id, event_type, title, actor_name, next_value, source_key)
    values (v_order_id, 'payment_updated', 'Payment status updated', 'Stripe',
      jsonb_build_object('status', p_payment_status), 'stripe-event:' || p_event_id)
    on conflict (source_key) do nothing;
  end if;

  update public.stripe_events set processed_at = now() where event_id = p_event_id;
  return true;
end;
$$;

alter table public.admin_users enable row level security;
alter table public.order_notes enable row level security;
alter table public.order_events enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.pending_order_uploads enable row level security;
alter table public.api_rate_limits enable row level security;

revoke all on public.admin_users, public.order_notes, public.order_events,
  public.contact_submissions, public.pending_order_uploads, public.api_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.admin_users, public.order_notes, public.order_events,
  public.contact_submissions, public.pending_order_uploads, public.api_rate_limits to service_role;
grant select, insert, update, delete on public.orders, public.order_items, public.order_files,
  public.payment_attempts, public.stripe_events to service_role;

revoke all on function public.check_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.claim_pending_order_upload(uuid, text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_set_fulfilment(uuid, text, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_verification(uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_add_order_note(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.register_payment_attempt(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.apply_stripe_event(text, text, text, text, text, text, timestamptz) from public, anon, authenticated;

grant execute on function public.check_api_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.claim_pending_order_upload(uuid, text, uuid, uuid) to service_role;
grant execute on function public.admin_set_fulfilment(uuid, text, uuid, text, text, text, text) to service_role;
grant execute on function public.admin_set_verification(uuid, text, uuid, text) to service_role;
grant execute on function public.admin_add_order_note(uuid, uuid, text, text) to service_role;
grant execute on function public.register_payment_attempt(uuid, text, integer) to service_role;
grant execute on function public.apply_stripe_event(text, text, text, text, text, text, timestamptz) to service_role;
-- End of migration.
