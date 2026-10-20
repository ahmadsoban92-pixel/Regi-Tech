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

The Boss uses Anita Semi-square by Gustavo Paz L., redistributed unmodified under CC BY-SA 4.0. See `public/assets/regitech/AnitaSemiSquare-LICENSE.txt` for attribution and the license link. Rebel uses the client-supplied New Rocker asset. The Scribbler remains unavailable until a web-redistributable license and file for Apple Chalkboard SE are supplied; the project does not ship an unlicensed substitute.

## Current integration boundary

The application contains the server-side Supabase order flow, private document upload, hosted Stripe Checkout, webhook handling, and dynamic confirmation. Live provider verification requires project credentials in `.env.local`; no credentials or customer files are stored in the repository.
