# Regi-Tech Supabase setup

## Local environment

Set these values in `.env.local` and in the matching Vercel environment:

- `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for server-only database and storage access.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Supabase Auth cookie refresh. The publishable key is safe to expose; the secret key is not.
- `RATE_LIMIT_HMAC_KEY` to a randomly generated value of at least 32 bytes. Keep it server-only.

## Bootstrap an administrator

1. Disable public sign-ups in Supabase Auth.
2. Create the administrator under **Authentication → Users** in the Supabase dashboard.
3. Copy that user's UUID and run the following in the SQL editor, replacing the placeholders:

```sql
insert into public.admin_users (user_id, email, display_name, role)
values ('AUTH-USER-UUID', 'owner@example.com', 'Owner Admin', 'owner');
```

No password belongs in SQL, source control, or chat. Additional administrators use the same process with role `admin`.

## Migration baseline

The first two migrations in this repository were executed manually before managed migration history existed. Do not rerun them against the current development project. When the project is linked with the Supabase CLI, mark versions `202610160001` and `202610200001` as applied with `supabase migration repair`; discover the current command flags with `supabase migration repair --help` first.
