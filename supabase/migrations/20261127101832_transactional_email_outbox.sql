create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order_confirmation', 'dispatch_confirmation', 'contact_alert')),
  entity_id uuid not null,
  deduplication_key text not null unique check (char_length(deduplication_key) between 1 and 200),
  status text not null default 'pending' check (status in ('pending', 'processing', 'retry', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 8),
  next_attempt_at timestamptz not null default now(),
  processing_started_at timestamptz,
  sent_at timestamptz,
  last_error text not null default '' check (char_length(last_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_outbox_claim_idx
  on public.email_outbox (status, next_attempt_at, created_at)
  where status in ('pending', 'retry', 'processing');
create index email_outbox_entity_idx on public.email_outbox (kind, entity_id);

alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from public, anon, authenticated;
grant select, insert, update, delete on public.email_outbox to service_role;

create function public.enqueue_order_email_outbox() returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    insert into public.email_outbox (kind, entity_id, deduplication_key)
    values ('order_confirmation', new.id, 'order-confirmation:' || new.id::text)
    on conflict (deduplication_key) do nothing;
  end if;

  if new.fulfilment_status = 'dispatched' and old.fulfilment_status is distinct from 'dispatched' then
    insert into public.email_outbox (kind, entity_id, deduplication_key)
    values ('dispatch_confirmation', new.id, 'dispatch-confirmation:' || new.id::text)
    on conflict (deduplication_key) do nothing;
  end if;

  return new;
end;
$$;

create trigger enqueue_order_email_outbox
after update of payment_status, fulfilment_status on public.orders
for each row execute function public.enqueue_order_email_outbox();

create function public.enqueue_contact_email_outbox() returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.email_outbox (kind, entity_id, deduplication_key)
  values ('contact_alert', new.id, 'contact-alert:' || new.id::text)
  on conflict (deduplication_key) do nothing;
  return new;
end;
$$;

create trigger enqueue_contact_email_outbox
after insert on public.contact_submissions
for each row execute function public.enqueue_contact_email_outbox();

create function public.claim_email_outbox(p_limit integer default 10)
returns setof public.email_outbox
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with candidates as (
    select outbox.id
    from public.email_outbox as outbox
    where outbox.attempt_count < 8
      and (
        (outbox.status in ('pending', 'retry') and outbox.next_attempt_at <= now())
        or (outbox.status = 'processing' and outbox.processing_started_at <= now() - interval '5 minutes')
      )
    order by outbox.next_attempt_at, outbox.created_at
    for update skip locked
    limit least(greatest(p_limit, 1), 50)
  ), claimed as (
    update public.email_outbox as outbox
    set status = 'processing',
        attempt_count = outbox.attempt_count + 1,
        processing_started_at = now(),
        updated_at = now()
    from candidates
    where outbox.id = candidates.id
    returning outbox.*
  )
  select * from claimed;
end;
$$;

create function public.complete_email_outbox(p_id uuid) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.email_outbox
  set status = 'sent',
      sent_at = now(),
      processing_started_at = null,
      last_error = '',
      updated_at = now()
  where id = p_id and status = 'processing';
  return found;
end;
$$;

create function public.fail_email_outbox(
  p_id uuid,
  p_error text,
  p_permanent boolean default false
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.email_outbox
  set status = case when p_permanent or attempt_count >= 8 then 'failed' else 'retry' end,
      next_attempt_at = case
        when p_permanent or attempt_count >= 8 then next_attempt_at
        else now() + make_interval(secs => case attempt_count
          when 1 then 60
          when 2 then 300
          when 3 then 1800
          when 4 then 7200
          when 5 then 21600
          when 6 then 43200
          else 86400
        end)
      end,
      processing_started_at = null,
      last_error = left(coalesce(nullif(trim(p_error), ''), 'Email delivery failed.'), 500),
      updated_at = now()
  where id = p_id and status = 'processing';
  return found;
end;
$$;

create function public.retry_email_outbox(p_id uuid) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.email_outbox
  set status = 'pending',
      attempt_count = 0,
      next_attempt_at = now(),
      processing_started_at = null,
      sent_at = null,
      last_error = '',
      updated_at = now()
  where id = p_id and status in ('retry', 'failed');
  return found;
end;
$$;

revoke all on function public.enqueue_order_email_outbox() from public, anon, authenticated;
revoke all on function public.enqueue_contact_email_outbox() from public, anon, authenticated;
revoke all on function public.claim_email_outbox(integer) from public, anon, authenticated;
revoke all on function public.complete_email_outbox(uuid) from public, anon, authenticated;
revoke all on function public.fail_email_outbox(uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.retry_email_outbox(uuid) from public, anon, authenticated;

grant execute on function public.claim_email_outbox(integer) to service_role;
grant execute on function public.complete_email_outbox(uuid) to service_role;
grant execute on function public.fail_email_outbox(uuid, text, boolean) to service_role;
grant execute on function public.retry_email_outbox(uuid) to service_role;
