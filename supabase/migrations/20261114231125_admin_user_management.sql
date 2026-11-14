create table public.admin_user_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null,
  target_user_id uuid not null,
  target_email text not null,
  action text not null check (action in ('invited', 'role_changed', 'deactivated', 'reactivated', 'removed')),
  previous_role text,
  new_role text,
  previous_active boolean,
  new_active boolean,
  created_at timestamptz not null default now()
);

create index admin_user_events_created_at_idx on public.admin_user_events (created_at desc);
create index admin_user_events_target_idx on public.admin_user_events (target_user_id, created_at desc);

alter table public.admin_user_events enable row level security;
revoke all on public.admin_user_events from anon, authenticated;
grant select, insert on public.admin_user_events to service_role;

create function public.admin_invite_user(
  p_actor_id uuid,
  p_target_id uuid,
  p_email text,
  p_display_name text,
  p_role text
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor public.admin_users%rowtype;
begin
  perform pg_advisory_xact_lock(78219429);
  select * into v_actor from public.admin_users where user_id = p_actor_id and active = true and role = 'owner';
  if not found then raise exception 'Owner access required'; end if;
  if p_role not in ('owner', 'admin') then raise exception 'Invalid role'; end if;
  insert into public.admin_users (user_id, email, display_name, role, active)
  values (p_target_id, lower(trim(p_email)), trim(p_display_name), p_role, true);
  insert into public.admin_user_events (actor_id, actor_name, target_user_id, target_email, action, new_role, new_active)
  values (p_actor_id, coalesce(nullif(v_actor.display_name, ''), v_actor.email), p_target_id, lower(trim(p_email)), 'invited', p_role, true);
  return true;
end;
$$;

create function public.admin_change_user(
  p_actor_id uuid,
  p_target_id uuid,
  p_role text,
  p_active boolean
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor public.admin_users%rowtype;
  v_target public.admin_users%rowtype;
begin
  perform pg_advisory_xact_lock(78219429);
  select * into v_actor from public.admin_users where user_id = p_actor_id and active = true and role = 'owner';
  if not found then raise exception 'Owner access required'; end if;
  select * into v_target from public.admin_users where user_id = p_target_id for update;
  if not found then raise exception 'Administrator not found'; end if;
  if p_role not in ('owner', 'admin') or p_active is null then raise exception 'Invalid access settings'; end if;
  if p_target_id = p_actor_id and (p_role <> 'owner' or p_active = false) then
    raise exception 'You cannot remove your own owner access';
  end if;
  if v_target.role = 'owner' and v_target.active and (p_role <> 'owner' or p_active = false)
     and (select count(*) from public.admin_users where role = 'owner' and active) <= 1 then
    raise exception 'At least one active owner is required';
  end if;
  if v_target.role = p_role and v_target.active = p_active then return true; end if;
  update public.admin_users set role = p_role, active = p_active, updated_at = now() where user_id = p_target_id;
  insert into public.admin_user_events
    (actor_id, actor_name, target_user_id, target_email, action, previous_role, new_role, previous_active, new_active)
  values
    (p_actor_id, coalesce(nullif(v_actor.display_name, ''), v_actor.email), p_target_id, v_target.email,
     case when v_target.active <> p_active then case when p_active then 'reactivated' else 'deactivated' end else 'role_changed' end,
     v_target.role, p_role, v_target.active, p_active);
  return true;
end;
$$;

create function public.admin_remove_user(
  p_actor_id uuid,
  p_target_id uuid
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor public.admin_users%rowtype;
  v_target public.admin_users%rowtype;
begin
  perform pg_advisory_xact_lock(78219429);
  select * into v_actor from public.admin_users where user_id = p_actor_id and active = true and role = 'owner';
  if not found then raise exception 'Owner access required'; end if;
  if p_actor_id = p_target_id then raise exception 'You cannot remove your own account'; end if;
  select * into v_target from public.admin_users where user_id = p_target_id for update;
  if not found then raise exception 'Administrator not found'; end if;
  if v_target.role = 'owner' and v_target.active
     and (select count(*) from public.admin_users where role = 'owner' and active) <= 1 then
    raise exception 'At least one active owner is required';
  end if;
  delete from public.admin_users where user_id = p_target_id;
  insert into public.admin_user_events
    (actor_id, actor_name, target_user_id, target_email, action, previous_role, previous_active, new_active)
  values
    (p_actor_id, coalesce(nullif(v_actor.display_name, ''), v_actor.email), p_target_id, v_target.email,
     'removed', v_target.role, v_target.active, false);
  return true;
end;
$$;

revoke all on function public.admin_invite_user(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_change_user(uuid, uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.admin_remove_user(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_invite_user(uuid, uuid, text, text, text) to service_role;
grant execute on function public.admin_change_user(uuid, uuid, text, boolean) to service_role;
grant execute on function public.admin_remove_user(uuid, uuid) to service_role;
