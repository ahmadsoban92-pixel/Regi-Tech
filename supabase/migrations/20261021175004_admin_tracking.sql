create or replace function public.admin_save_tracking(
  p_order_id uuid,
  p_actor_id uuid,
  p_actor_name text,
  p_carrier text,
  p_tracking_reference text
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_previous jsonb;
begin
  select jsonb_build_object('carrier', carrier, 'trackingReference', tracking_reference)
  into v_previous from public.orders where id = p_order_id for update;
  if not found then return false; end if;
  update public.orders
  set carrier = trim(p_carrier), tracking_reference = trim(p_tracking_reference), updated_at = now()
  where id = p_order_id;
  insert into public.order_events (order_id, event_type, title, actor_id, actor_name, previous_value, next_value)
  values (p_order_id, 'tracking_updated', 'Carrier and tracking updated', p_actor_id, p_actor_name,
    v_previous, jsonb_build_object('carrier', trim(p_carrier), 'trackingReference', trim(p_tracking_reference)));
  return true;
end;
$$;

revoke all on function public.admin_save_tracking(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.admin_save_tracking(uuid, uuid, text, text, text) to service_role;
-- End of migration.
