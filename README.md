# Regi-Tech Motorcycle Number Plate Website

Responsive Next.js implementation of the Regi-Tech customer storefront and plate-ordering journey.

## Local development

This project is pinned to pnpm 11.25.0. Corepack ships with supported Node.js releases and will use the version declared in `package.json`.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` when local server settings are needed. The optional Ideal Postcodes integration uses a server-only key:

```bash
IDEAL_POSTCODES_API_KEY=ak_your_key_here
```

Without that key, checkout continues to support validated manual delivery and billing addresses.

Phase 4 order persistence and hosted payment use server-only Supabase and Stripe credentials. Never prefix these secrets with `NEXT_PUBLIC_`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_server_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Apply `supabase/migrations/202610160001_phase4_orders.sql` followed by `supabase/migrations/202610200001_multi_plate_order_items.sql` to the Supabase project before live checkout testing. They create the order tables, multi-plate line items, row-level security, private `v5c-documents` and `order-artwork` buckets, and idempotent payment-event functions. Point Stripe Checkout webhooks at `/api/v1/webhooks/stripe` and subscribe to Checkout completion, asynchronous success/failure, and expiry events.

If the project is moved or copied to another directory, do not copy `node_modules` or `.next`. Delete those generated directories in the destination and run the install command again so pnpm can create links for the new absolute path.

## Available routes

- `/` — homepage
- `/our-plates` — product catalogue
- `/how-it-works` — ordering guide
- `/faqs` — frequently asked questions
- `/contact` — contact details and validated form
- `/design` — product-specific live plate configurator
- `/review` — order review and customer confirmation
- `/checkout` — validated customer and delivery form
- `/order-confirmation` — confirmation layout

## Verification

```bash
corepack pnpm typecheck
corepack pnpm build
```

## Font licensing

The Boss uses Anita Semi-square by Gustavo Paz L., redistributed unmodified under CC BY-SA 4.0. See `public/assets/regitech/AnitaSemiSquare-LICENSE.txt` for attribution and the license link. Rebel uses the client-supplied New Rocker asset. The Scribbler uses the supplied Rock Salt font under the Apache 2.0 licence; see `public/assets/regitech/RockSalt-LICENSE.txt`.

## Current integration boundary

The application contains the server-side Supabase order flow, private document upload, hosted Stripe Checkout, webhook handling, and dynamic confirmation. Live provider verification requires project credentials in `.env.local`; no credentials or customer files are stored in the repository.

## Royal Mail Click & Drop

The Admin order page can prepare one Click & Drop shipment after an order is paid, verified, and moved to **In production**. Staff enter the packed weight and dimensions. The app selects the account's Tracked 48 LBT service for parcels up to 750 g and strictly under 300 × 220 × 20 mm; larger supported parcels use standard Tracked 48. The service codes are `TRS48` and `TPS48` with register code `01`. The integration's selected trading name supplies the return address.

Before enabling the controls, apply `supabase/migrations/20261123000449_royal_mail_shipments.sql` and `supabase/migrations/20261123000557_royal_mail_booked_by_index.sql` after all earlier migrations. Both are already applied to the empty client-owned Supabase project. Set `ROYAL_MAIL_CLICK_DROP_API_KEY` only in the private server environment. Never put the key in a `NEXT_PUBLIC_` variable or commit it. The key is visible in Click & Drop under **Settings → Integrations → Click & Drop API**. A missing key disables label booking but leaves manual carrier and tracking entry available.

The operator flow is: confirm the final parcel measurements, create the label once, download and print the PDF, hand the parcel to Royal Mail, then mark it handed over in Admin. A timed-out booking stays reserved to prevent a duplicate label. **Recover booking** checks Click & Drop by the order reference and records an existing label; if none appears, reconcile it manually before another booking attempt. Label downloads require an active Admin session. This integration does not manifest orders or send customer dispatch emails; those remain separate operational steps. Do not use live booking as a connectivity test because it can create a real label.
