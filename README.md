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

## Current integration boundary

The customer flow is implemented as an interactive frontend. Supabase order persistence and live payment-provider processing are intentionally not connected yet; those require the approved schema, project credentials, and payment gateway credentials.
