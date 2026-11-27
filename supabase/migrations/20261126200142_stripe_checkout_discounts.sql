-- Stripe Checkout applies promotion codes; record the signed, paid session total
-- atomically with the existing payment event. Historic orders default to no discount.
alter table public.orders add column discount_pence integer not null default 0
  check (discount_pence >= 0);

-- Keep the seven-argument version during the rolling deployment so existing
-- Checkout sessions and the currently running server can still finish.
create function public.apply_stripe_event(
  p_event_id text,
  p_event_type text,
  p_session_id text,
  p_payment_status text,
  p_attempt_status text,
  p_payment_intent_id text,
  p_paid_at timestamptz,
  p_amount_subtotal integer,
  p_amount_total integer,
  p_amount_discount integer
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal integer;
  v_delivery integer;
  v_currency text;
  v_status text;
begin
  insert into public.stripe_events (event_id, event_type) values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;
  if not found then return false; end if;

  select order_id into v_order_id from public.payment_attempts
  where stripe_checkout_session_id = p_session_id;

  if v_order_id is not null then
    select subtotal_pence, delivery_pence, currency, payment_status
      into v_subtotal, v_delivery, v_currency, v_status
      from public.orders where id = v_order_id for update;

    if p_payment_status = 'paid' then
      if v_currency <> 'gbp'
        or p_amount_subtotal is distinct from v_subtotal
        or p_amount_total is null or p_amount_total < 0
        or p_amount_discount is null or p_amount_discount < 0
        or p_amount_total + p_amount_discount <> v_subtotal + v_delivery then
        raise exception 'Stripe Checkout amount does not match order';
      end if;
    end if;

    update public.payment_attempts set
      status = p_attempt_status,
      amount_pence = case when p_payment_status = 'paid' then p_amount_total else amount_pence end,
      updated_at = now()
    where stripe_checkout_session_id = p_session_id;

    update public.orders set
      payment_status = case when payment_status = 'paid' then payment_status else p_payment_status end,
      stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
      paid_at = case when p_payment_status = 'paid' then coalesce(p_paid_at, now()) else paid_at end,
      discount_pence = case when p_payment_status = 'paid' and v_status <> 'paid' then p_amount_discount else discount_pence end,
      total_pence = case when p_payment_status = 'paid' and v_status <> 'paid' then p_amount_total else total_pence end,
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

revoke all on function public.apply_stripe_event(text, text, text, text, text, text, timestamptz, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.apply_stripe_event(text, text, text, text, text, text, timestamptz, integer, integer, integer)
  to service_role;
