# Regi-Tech Supabase setup

## Local environment

Set these values in `.env.local` and in the matching deployment environment (VPS and, if retained, Vercel):

- `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for server-only database and storage access.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Supabase Auth cookie refresh. The publishable key is safe to expose; the secret key is not.
- `RATE_LIMIT_HMAC_KEY` to a randomly generated value of at least 32 bytes. Keep it server-only.

## Bootstrap the first owner

1. Disable public sign-ups in Supabase Auth.
2. Create the administrator under **Authentication → Users** in the Supabase dashboard.
3. Copy that user's UUID and run the following in the SQL editor, replacing the placeholders:

```sql
insert into public.admin_users (user_id, email, display_name, role)
values ('AUTH-USER-UUID', 'owner@example.com', 'Owner Admin', 'owner');
```

No password belongs in SQL, source control, or chat. After the first owner signs in, additional users are invited from **Admin → Admin Users**. Owners can assign Owner or Admin, change roles, deactivate/reactivate, and remove access. The portal prevents removal of the signed-in owner and the final active owner.

## Invitation email setup

1. In **Authentication → URL Configuration**, set the Site URL to the live HTTPS site and add `https://regitech.co.uk/admin/accept-invite` to the allowed redirect URLs. Add a separate staging URL only when testing a staging deployment.
2. Configure a custom SMTP provider in **Authentication → SMTP**. Supabase's default sender is not suitable for sending invitations to arbitrary staff addresses.
3. The default Supabase invitation template is supported by the acceptance page. For a server-verified invitation link, set the Invite user email template link to:

   ```html
   <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=invite">Accept your Regi-Tech invitation</a>
   ```

4. Send a test invitation to a spare address. The invitee accepts it, sets a password of at least 12 characters, and signs in. Confirm that an inactive account cannot sign in to the portal.

If an unused invitation expires, the owner can remove the unaccepted account in Admin Users and send a fresh invitation.

The invite destination is derived from `NEXT_PUBLIC_SITE_URL`; it must point to the same deployment whose Supabase credentials are configured.

## Migration baseline

The first two migrations in this repository were executed manually before managed migration history existed. Do not rerun them against the current development project. When the project is linked with the Supabase CLI, mark versions `202610160001` and `202610200001` as applied with `supabase migration repair`; discover the current command flags with `supabase migration repair --help` first.

The admin-user migrations are `20261114231125_admin_user_management.sql` and `20261114231556_admin_user_events_actor_index.sql`. Both have been applied to the development project. Their filenames use the exact versions recorded in that project's migration history.

## Client-owned project cutover

If the client's target Supabase project is empty, it should receive **all** migrations in timestamp order. The two manually applied development baseline migrations are **not** a special case on a fresh project; do not mark them as applied there without actually running them. Before any push, inspect the target project's tables and migration history to avoid duplicate schema changes.

1. Obtain team access to the client project and its project reference. Do not share project passwords or secret keys in chat.
2. Back up the development project and decide whether it contains any real orders or files that must be retained. If it contains only test data, start the client project with empty orders and create a fresh owner account. A genuine data transfer must also preserve Auth users and copy private Storage objects; a database schema export alone is insufficient.
3. Install the current Supabase CLI and inspect `supabase --help`, `supabase migration --help`, `supabase db --help`, and their relevant subcommand help. Link this repository to the client project, inspect `supabase migration list --remote`, and run `supabase db push --remote --dry-run` before applying the migrations. Check the printed target project reference carefully.
4. Apply the migrations to the client project, verify RLS, service-role-only functions, and the private `v5c-documents` and `order-artwork` buckets. Run the Supabase security and performance advisors.
5. Disable public registration, configure the live Site URL and invitation redirect, set up custom SMTP, create the client's Auth account, and insert that account as the first `owner` in `admin_users` using the SQL above.
6. In the VPS private `.env.local` and any Vercel fallback environment, replace `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with values from the client project. Keep the existing HMAC key private. Rebuild and restart the app because `NEXT_PUBLIC_` values are baked into the browser build.
7. Test owner login, Admin Users invitation, orders, contact submissions, private uploads, checkout, webhook processing, and confirmation against the client project before accepting live orders. Keep the old project available for rollback until acceptance is complete.

Use a short checkout maintenance window for the final switch so a Stripe session created against one project cannot return after the application has switched to the other.
