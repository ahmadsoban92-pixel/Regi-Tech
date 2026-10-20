create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  position integer not null check (position >= 0),
  configuration jsonb not null,
  price_breakdown jsonb not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_total_pence integer not null check (unit_total_pence >= 0),
  line_total_pence integer not null check (line_total_pence >= 0),
  created_at timestamptz not null default now(),
  unique (order_id, position)
);

insert into public.order_items (
  order_id,
  position,
  configuration,
  price_breakdown,
  quantity,
  unit_total_pence,
  line_total_pence
)
select
  id,
  0,
  configuration,
  price_breakdown,
  quantity,
  case when quantity > 0 then subtotal_pence / quantity else subtotal_pence end,
  subtotal_pence
from public.orders
where configuration is not null
on conflict (order_id, position) do nothing;

alter table public.orders
  alter column configuration drop not null,
  alter column price_breakdown drop not null,
  alter column quantity drop not null;

alter table public.order_files
  add column order_item_id uuid references public.order_items(id) on delete cascade;

create index order_files_item_created_idx on public.order_files (order_item_id, created_at)
  where order_item_id is not null;

alter table public.order_items enable row level security;
revoke all on public.order_items from anon, authenticated;
