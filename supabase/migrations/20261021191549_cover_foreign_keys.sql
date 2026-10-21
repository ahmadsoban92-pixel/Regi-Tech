create index order_events_actor_idx on public.order_events (actor_id) where actor_id is not null;
create index order_notes_author_idx on public.order_notes (author_id) where author_id is not null;
create index orders_cancelled_by_idx on public.orders (cancelled_by) where cancelled_by is not null;
create index pending_order_uploads_order_idx on public.pending_order_uploads (order_id) where order_id is not null;
create index pending_order_uploads_item_idx on public.pending_order_uploads (order_item_id) where order_item_id is not null;
-- End of migration.
