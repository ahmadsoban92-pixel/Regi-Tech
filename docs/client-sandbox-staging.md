# Client sandbox staging

The client payment test runs separately from the public website. The public
`regitech` service remains on `127.0.0.1:3000`; the client sandbox service is
`regitech-client-staging` on `127.0.0.1:3001`. Nginx does not expose port 3001.

## Private configuration

Keep these values in `/srv/regitech/staging/.env.local` with mode `0600`, owned
by `regitech`. Never commit or paste secret values into a report or chat.

- `NEXT_PUBLIC_SITE_URL=http://localhost:3001`
- `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`: client project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: client publishable key
- `SUPABASE_SECRET_KEY`: client project secret key
- `RATE_LIMIT_HMAC_KEY`: independent random 32-byte value
- `STRIPE_SECRET_KEY`: **License Plate Workshop Ltd sandbox** key, never a live key
- `STRIPE_WEBHOOK_SECRET`: secret printed by the matching Stripe CLI listener

Optional provider keys can remain empty for this payment test.

## Build and start

In `/srv/regitech/staging`, install with `corepack pnpm install --frozen-lockfile`,
run `corepack pnpm test`, `corepack pnpm typecheck`, then
`corepack pnpm build`. After the private environment file and build are ready,
start `regitech-client-staging` and check its journal. Keep the service bound to
`127.0.0.1:3001`.

The Stripe CLI listener must use the same dedicated sandbox key and forward
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, and
`checkout.session.async_payment_failed` to
`http://127.0.0.1:3001/api/v1/webhooks/stripe`. Its signing secret belongs only
in the staging environment file. A CLI listener is suitable for this temporary
test; production requires a permanent Stripe webhook endpoint.

## Private browser access

Use an SSH tunnel from the tester's computer:

```text
ssh -L 3001:127.0.0.1:3001 root@129.121.94.29
```

Open `http://localhost:3001` while the tunnel is running. The public domain
continues to use its existing payment configuration. Test a successful sandbox
payment, a cancelled checkout, and a failed card attempt. Confirm the successful
order becomes paid from a verified webhook and appears in Admin, while cancelled
and failed attempts do not become paid. Record only order references and statuses,
not customer payment details.

## Keep the environments separate

The client Supabase project starts with no orders or administrators. Create the
staging Auth user privately and allowlist its UUID as an active Owner. Do not
copy production or development orders into the client project for this test.
Do not change Nginx, the public service, its environment file, DNS, or live
Stripe settings during staging.
