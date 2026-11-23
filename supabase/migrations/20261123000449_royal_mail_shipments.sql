create table public.royal_mail_shipments (
  order_id uuid primary key references public.orders(id) on delete restrict,
  reservation_token uuid not null default gen_random_uuid(),
  status text not null default 'reserved' check (status in ('reserved', 'booked', 'dispatched')),
  service_code text not null check (service_code in ('TRS48', 'TPS48')),
  weight_grams integer not null check (weight_grams between 1 and 20000),
  length_mm integer not null check (length_mm > 0),
  width_mm integer not null check (width_mm > 0),
  depth_mm integer not null check (depth_mm > 0),
  external_order_id bigint unique check (external_order_id > 0),
  tracking_number text not null default '',
  booked_by uuid references auth.users(id) on delete set null,
  booked_at timestamptz,
  dispatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint royal_mail_booked_has_id check (status = 'reserved' or external_order_id is not null)
);

create index royal_mail_shipments_status_idx on public.royal_mail_shipments(status, created_at);
alter table public.royal_mail_shipments enable row level security;
revoke all on public.royal_mail_shipments from public, anon, authenticated;
grant select, insert, update on public.royal_mail_shipments to service_role;

create function public.protect_royal_mail_fulfilment() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.fulfilment_status is distinct from old.fulfilment_status and
     new.fulfilment_status in ('cancelled', 'dispatched') and
     exists (select 1 from public.royal_mail_shipments
             where order_id = old.id and status <> 'dispatched') then
    raise exception 'Reconcile the Royal Mail shipment before changing fulfilment status';
  end if;
  return new;
end;
$$;

create trigger protect_royal_mail_fulfilment before update of fulfilment_status on public.orders
for each row execute function public.protect_royal_mail_fulfilment();
revoke all on function public.protect_royal_mail_fulfilment() from public, anon, authenticated;
grant execute on function public.protect_royal_mail_fulfilment() to service_role;

create function public.admin_reserve_royal_mail_shipment(
  p_order_id uuid, p_service_code text, p_weight_grams integer,
  p_length_mm integer, p_width_mm integer, p_depth_mm integer, p_actor_id uuid
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_shipment public.royal_mail_shipments%rowtype;
  v_created boolean := false;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_status <> 'paid' or
     v_order.verification_status not in ('approved', 'not_required') or
     v_order.fulfilment_status <> 'in_production' or
     char_length(trim(v_order.tracking_reference)) > 0 then
    raise exception 'Order is not ready for Royal Mail booking';
  end if;
  if p_service_code not in ('TRS48', 'TPS48') or p_weight_grams not between 1 and 20000 or
     p_length_mm <= 0 or p_width_mm <= 0 or p_depth_mm <= 0 then
    raise exception 'Invalid parcel measurements';
  end if;
  insert into public.royal_mail_shipments
    (order_id, service_code, weight_grams, length_mm, width_mm, depth_mm, booked_by)
  values (p_order_id, p_service_code, p_weight_grams, p_length_mm, p_width_mm, p_depth_mm, p_actor_id)
  on conflict (order_id) do nothing
  returning * into v_shipment;
  v_created := found;
  if not v_created then
    select * into v_shipment from public.royal_mail_shipments where order_id = p_order_id;
  end if;
  return jsonb_build_object('created', v_created, 'shipment', to_jsonb(v_shipment));
end;
$$;

create function public.admin_confirm_royal_mail_shipment(
  p_order_id uuid, p_reservation_token uuid, p_external_order_id bigint,
  p_tracking_number text, p_actor_id uuid, p_actor_name text
) returns boolean language plpgsql security invoker set search_path = public as $$
declare
  v_shipment public.royal_mail_shipments%rowtype;
begin
  select * into v_shipment from public.royal_mail_shipments where order_id = p_order_id for update;
  if not found or v_shipment.reservation_token <> p_reservation_token then return false; end if;
  if v_shipment.status = 'booked' and v_shipment.external_order_id = p_external_order_id then return true; end if;
  if v_shipment.status <> 'reserved' or p_external_order_id <= 0 then return false; end if;
  update public.royal_mail_shipments set
    status = 'booked', external_order_id = p_external_order_id,
    tracking_number = trim(p_tracking_number), booked_at = now(), updated_at = now()
  where order_id = p_order_id;
  update public.orders set carrier = 'Royal Mail', tracking_reference = trim(p_tracking_number), updated_at = now()
  where id = p_order_id and fulfilment_status = 'in_production' and payment_status = 'paid';
  if not found then raise exception 'Order is no longer ready for Royal Mail'; end if;
  insert into public.order_events (order_id, event_type, title, actor_id, actor_name, next_value)
  values (p_order_id, 'royal_mail_booked', 'Royal Mail label booked', p_actor_id, p_actor_name,
    jsonb_build_object('serviceCode', v_shipment.service_code, 'trackingNumber', trim(p_tracking_number)));
  return true;
end;
$$;

create function public.admin_finish_royal_mail_dispatch(
  p_order_id uuid, p_actor_id uuid, p_actor_name text
) returns boolean language plpgsql security invoker set search_path = public as $$
declare
  v_shipment public.royal_mail_shipments%rowtype;
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  select * into v_shipment from public.royal_mail_shipments where order_id = p_order_id for update;
  if not found then return false; end if;
  if v_shipment.status = 'dispatched' and v_order.fulfilment_status = 'dispatched' then return true; end if;
  if v_shipment.status <> 'booked' or char_length(trim(v_shipment.tracking_number)) = 0 or
     v_order.payment_status <> 'paid' or v_order.verification_status not in ('approved', 'not_required') or
     v_order.fulfilment_status <> 'in_production' then
    raise exception 'Royal Mail dispatch prerequisites are not met';
  end if;
  update public.royal_mail_shipments set status = 'dispatched', dispatched_at = now(), updated_at = now() where order_id = p_order_id;
  update public.orders set fulfilment_status = 'dispatched', carrier = 'Royal Mail',
    tracking_reference = v_shipment.tracking_number, dispatched_at = coalesce(dispatched_at, now()), updated_at = now()
  where id = p_order_id;
  insert into public.order_events (order_id, event_type, title, actor_id, actor_name, previous_value, next_value)
  values (p_order_id, 'royal_mail_dispatched', 'Handed to Royal Mail', p_actor_id, p_actor_name,
    jsonb_build_object('status', v_order.fulfilment_status),
    jsonb_build_object('status', 'dispatched', 'trackingNumber', v_shipment.tracking_number));
  return true;
end;
$$;

revoke all on function public.admin_reserve_royal_mail_shipment(uuid, text, integer, integer, integer, integer, uuid) from public, anon, authenticated;
revoke all on function public.admin_confirm_royal_mail_shipment(uuid, uuid, bigint, text, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_finish_royal_mail_dispatch(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_reserve_royal_mail_shipment(uuid, text, integer, integer, integer, integer, uuid) to service_role;
grant execute on function public.admin_confirm_royal_mail_shipment(uuid, uuid, bigint, text, uuid, text) to service_role;
grant execute on function public.admin_finish_royal_mail_dispatch(uuid, uuid, text) to service_role;
