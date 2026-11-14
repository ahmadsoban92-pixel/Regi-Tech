# Regi-Tech change report — 15 November 2026

Baseline: last pushed commit `c6ff699` (`fix: preserve public host on admin logout`). This report covers all project changes prepared for the next push.

## Owner-managed administrator accounts

- Added `/admin/users` to the admin portal. Its navigation link is shown to owners on desktop and mobile, and the page checks the owner role on the server.
- Owners can invite a user by name and email, assign Owner or Admin, change roles, deactivate or reactivate access, and remove an account. The page displays recent account activity with the actor and time.
- Added invitation acceptance and password setup pages. The invitation flow supports Supabase's standard email redirect and an optional server-verified token link. Invitees create their own password; no password is sent to the owner or stored in project code.
- Added server-side validation, rate limiting, and owner checks to every account-management action. Database functions serialize account changes and prevent self-removal or loss of the final active owner.
- Added an `admin_user_events` audit table, indexes, access-control functions, RLS, and service-role-only grants. Updated the checked-in database types. The two additive migrations have been applied to the existing development Supabase project; the client-owned project has not been changed.
- Updated admin UI copy and the Supabase setup guide with first-owner bootstrap, invitation email configuration, and client-project migration steps.

## Verification and release notes

- `pnpm test`: 35 tests passed.
- `pnpm typecheck`: passed.
- `pnpm build`: passed, including the new admin routes.
- `git diff --check`: passed. Windows line-ending notices did not report whitespace errors.
- Development database checks confirmed that the new audit table has RLS enabled, three account-management functions exist, and `anon`/`authenticated` cannot call them or read the audit table. An index advisory was resolved with the second migration.
- A real invitation email and complete owner/staff browser flow still require a configured SMTP sender and an acceptance test. The production VPS has not been deployed with this change.

## Files excluded from this commit

The existing untracked ZIP and older report files belong to the user and are left untouched. No environment file, password, or secret is included.
