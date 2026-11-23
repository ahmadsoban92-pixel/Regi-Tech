# Regi-Tech Reviews navigation change report — 24 November 2026

Baseline: last pushed `main` commit `51f0da4` (`feat: add reviews and refine road-legal preview`). This report covers every intended code change since that commit.

## Changes

- Added **Reviews** to the shared public navigation in `src/content/shared.json`, making it available in both desktop and mobile headers.
- Changed the header's desktop breakpoint from `lg` to `xl` in `src/components/layout/SiteHeader.tsx` so five links, the cart, WhatsApp and the plate CTA have room. The mobile menu remains available below that width.
- Added the homepage reviews copy in `src/content/home.json`.
- Created `src/components/home/HomeReviewsSection.tsx`, a themed section with the existing client-supplied Google and Trustpilot QR images and one CTA to `/reviews`. It makes no ratings or testimonial claims.
- Added that section between the FAQ preview and final plate CTA in `src/app/page.tsx`.

## Scope and verification

- No payment, Supabase, Stripe, email, checkout or Admin code was changed. This deployment must retain the VPS's existing provider configuration.
- `pnpm test`: 116 tests passed. `pnpm typecheck`: passed. `pnpm build`: passed when run outside the filesystem sandbox. `git diff --check`: passed.
- The generated homepage includes the Reviews links, new CTA and both QR images. A visual browser check of the local build was unavailable because local socket access was blocked.
- Existing unrelated untracked files are excluded from the commit and push.

## Deployment

After the approved push, deploy this revision to the VPS without altering its private environment file or Stripe listener. Check the public homepage, Reviews page, desktop and mobile navigation, existing checkout mode and application logs.
