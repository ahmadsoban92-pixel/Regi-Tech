create index royal_mail_shipments_booked_by_idx on public.royal_mail_shipments(booked_by) where booked_by is not null;
