create or replace function public.admin_list_orders(
  p_query text default '',
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_payment_status text default null,
  p_fulfilment_status text default null,
  p_page integer default 1,
  p_page_size integer default 25
) returns table (
  id uuid,
  reference text,
  created_at timestamptz,
  payment_status text,
  verification_status text,
  fulfilment_status text,
  customer jsonb,
  delivery_address jsonb,
  billing_address jsonb,
  subtotal_pence integer,
  delivery_pence integer,
  total_pence integer,
  currency text,
  order_notes text,
  carrier text,
  tracking_reference text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with filtered as (
    select o.*
    from public.orders o
    where (p_from is null or o.created_at >= p_from)
      and (p_to is null or o.created_at <= p_to)
      and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_fulfilment_status is null or o.fulfilment_status = p_fulfilment_status)
      and (
        nullif(trim(p_query), '') is null
        or o.reference ilike '%' || trim(p_query) || '%'
        or coalesce(o.customer ->> 'firstName', '') ilike '%' || trim(p_query) || '%'
        or coalesce(o.customer ->> 'lastName', '') ilike '%' || trim(p_query) || '%'
        or coalesce(o.customer ->> 'email', '') ilike '%' || trim(p_query) || '%'
        or exists (
          select 1
          from public.order_items oi
          where oi.order_id = o.id
            and (
              coalesce(oi.configuration ->> 'registration', '') ilike '%' || trim(p_query) || '%'
              or coalesce(oi.configuration ->> 'productName', '') ilike '%' || trim(p_query) || '%'
            )
        )
      )
  )
  select
    f.id,
    f.reference,
    f.created_at,
    f.payment_status,
    f.verification_status,
    f.fulfilment_status,
    f.customer,
    f.delivery_address,
    f.billing_address,
    f.subtotal_pence,
    f.delivery_pence,
    f.total_pence,
    f.currency,
    f.order_notes,
    f.carrier,
    f.tracking_reference,
    count(*) over () as total_count
  from filtered f
  order by f.created_at desc
  offset (greatest(p_page, 1) - 1) * least(greatest(p_page_size, 1), 100)
  limit least(greatest(p_page_size, 1), 100);
$$;

revoke all on function public.admin_list_orders(text, timestamptz, timestamptz, text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.admin_list_orders(text, timestamptz, timestamptz, text, text, integer, integer)
  to service_role;
