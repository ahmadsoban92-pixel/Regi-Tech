# Regi-Tech change report — 24 November 2026

Baseline: `origin/main` at `20017c0` (Royal Mail Click & Drop fulfilment).
These changes are uncommitted in `codex/reviews-stripe`. Nothing has been
pushed or deployed to the public website.

## Storefront changes

- Every storefront WhatsApp link now opens a separate tab with `noopener` and
  `noreferrer`, preserving the customer's current design or checkout page.
- A new `/reviews` page uses the two client-supplied QR images and matching
  Google and Trustpilot buttons. A Reviews link appears in the footer. The
  Google destination is the supplied business listing, not a direct review form.
- The 2D Printed Show Plate card no longer offers the manufacturing pop-up.
  The hero and other show-plate cards retain it.
- Road-legal registration rows stay horizontally centred when a flag is
  selected. The flag is fitted into the available left gutter beside the
  measured lower row and centred against its visible lettering.
- Added focused layout and product-content tests.

## Isolated client staging

- Copied the reviewed source to `/srv/regitech/staging` on the Bluehost VPS.
  Installed locked dependencies and built a separate Next.js release.
- Added the `regitech-client-staging` service bound to `127.0.0.1:3001` and a
  matching Stripe CLI sandbox webhook listener. Neither service is in public
  Nginx routing, and neither is enabled for reboot startup.
- Paired staging with the client Supabase project and the dedicated License
  Plate Workshop Ltd Stripe sandbox. The staging environment is private and
  excluded from Git. Created a temporary active Owner allowlist entry for
  `ahmadsoban92@gmail.com` in the client Supabase project.
- Kept the public service, public environment, DNS, and live Stripe settings
  unchanged.

## Verification

- Local: 58 tests passed, typecheck passed, production build passed, and
  `git diff --check` passed. The first two build attempts hit Windows
  generated-directory permission errors; a permitted build completed.
- VPS staging: 58 tests passed, typecheck passed, and production build passed.
  `/reviews`, `/our-plates`, both QR assets, and the storefront route returned
  HTTP 200. All rendered WhatsApp links checked on home, FAQ, and Contact pages
  have the new-tab and safe-link attributes. The two QR codes decode to the
  exact button URLs even at their displayed 280px size.
- The Stripe sandbox key was validated against account
  `acct_1UZrJrAydMIMA1gS`. The client Supabase secret key was validated with
  a server User-Agent against the client project. The staging app and listener
  are active on the VPS.
- A customer completed a £26.99 test-card purchase. Order `RT-26848371`
  became `paid` through the verified webhook, its payment attempt completed,
  the confirmation page loaded, and the signed-in staging Owner opened its
  Admin order page.
- The customer also tested Stripe's Back/Cancel link and a declined test card.
  The cancel returned to the website. Stripe showed the expected card decline;
  the corresponding payment intent reported `card_declined` and the order
  remained `pending_payment`, with no paid status applied.
- Browser checks confirmed that the Reviews page displays both QR cards,
  the 2D Printed Show Plate card omits the manufacturing pop-up button while
  the other eligible cards retain it, and the header WhatsApp link opens a
  separate tab while the storefront tab stays open.
- Desktop and 375px browser checks confirmed the road-legal registration rows
  remain centred with and without a UK flag and with and without the black
  inner border. The flag fits in the left gutter, and the mobile Reviews page
  stacks its content and review cards without clipping.

## Still to verify

- A permanent production webhook, live Stripe keys, and public client
  Supabase cutover. The current public website remains on its existing
  configuration.
- The temporary Stripe CLI signing secret appeared in its initial startup
  journal entry. Further listener output is suppressed. This is a private,
  localhost-only staging endpoint; production must use a fresh permanent
  webhook secret.
