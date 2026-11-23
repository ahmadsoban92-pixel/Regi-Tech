# Regi-Tech Royal Mail change report — 23 November 2026

Baseline: GitHub `main` and the Bluehost VPS are at `ffefa19`. The changes below are local and have not been committed, pushed, or deployed.

## Changes since the last pushed commit

- Added Royal Mail Tracked 48 LBT and standard Tracked 48 selection from staff-entered packed weight and dimensions. Oversized parcels are rejected before booking.
- Added a server-only Click & Drop API client for creating orders, looking up existing references, downloading PDF labels, and recording dispatch. The API key is read only from `ROYAL_MAIL_CLICK_DROP_API_KEY`.
- Added a one-shipment-per-order reservation and recovery flow to avoid duplicate labels after repeated clicks or uncertain network results.
- Added Admin order controls to book a label, recover an existing booking, download the label, and mark a parcel as handed to Royal Mail. Existing manual carrier/tracking entry remains for orders without a Royal Mail booking.
- Added an authenticated private label-download route and audit events for Royal Mail booking and dispatch.
- Added two additive Supabase migrations for the shipment table, protected functions, fulfilment guard, RLS, grants, and index. They were applied to the empty client Supabase project as versions `20261123000449` and `20261123000557`. No orders or labels were created there.
- Updated database types, `.env.example`, README operating instructions, and the implementation plan. Added focused tests for service selection, API mapping, duplicate prevention, recovery, and dispatch ordering.

## Verification and remaining work

- `pnpm test`: 56 tests passed; `pnpm typecheck`, `pnpm build`, and `git diff --check` passed.
- Client Supabase: shipment table has RLS; anonymous and authenticated roles cannot insert; only the service role can execute shipment functions. The performance advisor's newly reported unindexed `booked_by` foreign key was addressed.
- The Royal Mail key was added to the ignored local `.env.local` file. Read-only authenticated calls to the Click & Drop `/version` and `/services` endpoints returned HTTP 200; the account offers Tracked 48 LBT (`TRS48`) and standard Tracked 48 (`TPS48`). The key was not added to Git or this report. No billable label test has been made.
- The VPS runs the same `ffefa19` revision as GitHub. The Royal Mail key has not yet been added to its private environment. Deployment needs that configuration, an approved Git push, and a safe VPS release. A controlled label test needs a designated test order and acknowledgement that a real Royal Mail label may incur charges.
