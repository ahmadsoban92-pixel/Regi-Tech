# Regi-Tech transactional email operations

This runbook covers the production email path for order confirmations, dispatch notifications, Contact-form alerts, and Admin invitations. It assumes the application runs behind Nginx on `127.0.0.1:3000`, uses the client Supabase project, and keeps credentials outside Git.

## 1. DNS and mailbox readiness

Publish the following records in the authoritative DNS provider for `regitech.co.uk`. Do not replace an existing SPF record with a second SPF record; merge every approved sender into one `v=spf1` value.

| Type | Host | Value | Notes |
| --- | --- | --- | --- |
| A | `mail` | `162.241.252.218` | Bluehost mail host only; the website A record continues to point to the VPS. |
| MX | `@` | `mail.regitech.co.uk` | Priority `0`. |
| TXT | `@` | `v=spf1 +mx +a +ip4:162.241.252.218 ~all` | Merge if another SPF sender is later approved. |
| TXT | `default._domainkey` | The complete current DKIM value from Bluehost cPanel Email Deliverability | Copy the value exactly; do not reformat it. |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Monitoring policy for initial rollout. Tighten only after reviewing reports. |

After DNS propagation:

1. Confirm `mail.regitech.co.uk` resolves to the Bluehost mail IP.
2. In cPanel, confirm Email Routing is **Local Mail Exchanger**.
3. Run cPanel Email Deliverability and confirm SPF and DKIM pass.
4. Confirm AutoSSL has issued a valid certificate for `mail.regitech.co.uk` before enabling SMTP.
5. Sign in to webmail and send one message to an unrelated mailbox. Reply to it and confirm inbound and outbound delivery.
6. Inspect message headers at the receiving mailbox and confirm SPF and DKIM pass. DMARC should then pass through aligned SPF or DKIM.

The planned application identity is:

- Sender name: `Regi Tech`
- Sender and reply-to: `info@regitech.co.uk`
- Contact-form alert recipient: `info@regitech.co.uk`
- SMTP: `mail.regitech.co.uk`, port `465`, implicit TLS. Use port `587` with STARTTLS only if Bluehost confirms that configuration instead.

## 2. Private application environment

Generate independent random values for `RATE_LIMIT_HMAC_KEY` and `EMAIL_WORKER_SECRET`. `EMAIL_WORKER_SECRET` must contain at least 32 random bytes. Never reuse a Stripe, Supabase, mailbox, or login credential.

Set these values in the private `.env.local` used by the active VPS release:

```dotenv
SMTP_HOST=mail.regitech.co.uk
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@regitech.co.uk
SMTP_PASSWORD=<enter-private-mailbox-password>
EMAIL_FROM_NAME=Regi Tech
EMAIL_FROM_ADDRESS=info@regitech.co.uk
EMAIL_REPLY_TO=info@regitech.co.uk
EMAIL_ADMIN_RECIPIENT=info@regitech.co.uk
EMAIL_WORKER_SECRET=<independent-random-secret>
```

The same release must contain the **client** Supabase URL, publishable key, and secret key. Confirm the project reference is `yqozfpblpvpnitrzzlyf` without printing any key. Stripe remains in the client sandbox until the live-payment cutover is separately approved.

Protect the environment file and restart only after a successful build:

```bash
chmod 600 /srv/regitech/releases/<release>/.env.local
chown regitech:regitech /srv/regitech/releases/<release>/.env.local
systemctl restart regitech
systemctl is-active regitech
```

Do not type a secret into shell history. Enter it through an editor with history disabled or transfer an already protected file over SSH, then delete the transfer copy.

## 3. Install the recovery worker

The application schedules a fast email attempt after successful business requests. The timer below is the durable recovery path for restarts, short SMTP outages, or missed request-local work.

1. Copy the versioned units:

   ```bash
   install -o root -g root -m 0644 ops/systemd/regitech-email-worker.service /etc/systemd/system/regitech-email-worker.service
   install -o root -g root -m 0644 ops/systemd/regitech-email-worker.timer /etc/systemd/system/regitech-email-worker.timer
   install -d -o root -g root -m 0700 /etc/regitech
   install -o root -g root -m 0600 ops/systemd/regitech-email-worker.curl.example /etc/regitech/email-worker.curl
   ```

2. Edit `/etc/regitech/email-worker.curl` and replace the placeholder with the exact `EMAIL_WORKER_SECRET` from the active application environment. Keep the `Bearer ` prefix.
3. Validate before installation or restart:

   ```bash
   systemd-analyze verify /etc/systemd/system/regitech-email-worker.service /etc/systemd/system/regitech-email-worker.timer
   systemctl daemon-reload
   systemctl start regitech-email-worker.service
   systemctl status regitech-email-worker.service --no-pager
   ```

4. Enable the recovery timer only after the manual call succeeds:

   ```bash
   systemctl enable --now regitech-email-worker.timer
   systemctl list-timers regitech-email-worker.timer --all
   journalctl -u regitech-email-worker.service -n 50 --no-pager
   ```

The curl configuration discards the response body. Logs show only success/failure and never the bearer value or email contents.

## 4. Supabase Authentication SMTP

Admin invitations are sent by Supabase Auth, not by the application outbox. In the **client** Supabase project:

1. Open **Authentication → Email / SMTP settings** and enable Custom SMTP.
2. Use sender name `Regi Tech` and sender address `info@regitech.co.uk`.
3. Set host `mail.regitech.co.uk`, port `465`, username `info@regitech.co.uk`, and enter the mailbox password privately.
4. Use the encrypted/TLS option for port 465. If Supabase cannot connect on 465, confirm Bluehost supports port 587 and then use STARTTLS rather than disabling encryption.
5. Set the Site URL to `https://regitech.co.uk`.
6. Permit the exact invitation and password routes used by the portal: `https://regitech.co.uk/admin/accept-invite` and `https://regitech.co.uk/admin/set-password`.
7. Review the invitation, password-reset, and confirmation templates. Keep links generated by Supabase and do not insert credentials into template text.
8. Invite a non-owner test address, accept the invitation, set a password, sign in, and then deactivate/remove the test user.

Check the Bluehost automated-sending limit before production. If transactional volume approaches that limit or deliverability is poor, migrate both Nodemailer and Supabase Custom SMTP to a dedicated transactional provider.

## 5. Acceptance tests

Use only client-owned staging accounts until the final live-payment approval.

1. Submit the Contact form and confirm exactly one alert arrives at the Admin mailbox.
2. Complete one Stripe sandbox checkout and confirm exactly one customer order email.
3. Mark that test order dispatched without buying a Royal Mail label and confirm exactly one dispatch email with the expected tracking state.
4. Confirm the Owner-only **Admin → Email Delivery** page records each message as `sent`.
5. Temporarily use an invalid SMTP password in a private staging release, generate a disposable test event, and confirm it becomes `retry` without breaking checkout. Restore the correct password and use the Owner retry action.
6. Confirm message headers pass SPF, DKIM, and DMARC, links use `https://regitech.co.uk`, replies go to the Regi-Tech mailbox, and no test message contains staging URLs.

## 6. Queue inspection and recovery

The Owner can filter delivery status/type and retry `retry` or `failed` rows at `/admin/emails`. The page intentionally does not display recipient addresses or message bodies.

Operational checks:

```bash
systemctl is-active regitech regitech-email-worker.timer
systemctl list-timers regitech-email-worker.timer --all
journalctl -u regitech-email-worker.service --since "1 hour ago" --no-pager
```

The worker uses bounded retries and deterministic Message-IDs. Delivery is at-least-once: a provider accepting a message immediately before a process failure can still cause a rare duplicate. Do not delete outbox rows to clear an error; correct the configuration and use the retry action.

## 7. Rollback

If email delivery causes errors:

1. Stop the timer: `systemctl disable --now regitech-email-worker.timer`.
2. Roll the application symlink/service back to the last accepted release and restart `regitech`.
3. Leave the additive `email_outbox` migration in place. It is service-role-only and safe while the worker is stopped.
4. Do not remove queued rows. After the corrected release is restored, re-enable the timer and retry eligible failures from the Owner page.
5. If Supabase invitation delivery is failing, disable Custom SMTP only after confirming the fallback limitations; existing application email can remain independently disabled through the timer/application rollback.

## 8. Credential rotation

Rotate one credential at a time and verify delivery before removing the previous access:

- **Mailbox password:** update the active app environment and Supabase Custom SMTP, restart the app, and run both application and invitation tests.
- **Worker secret:** update the app environment and `/etc/regitech/email-worker.curl`, restart the app, then manually start the worker service.
- **Supabase secret key:** update the active app environment only; never place it in client code or a public variable.
- **Stripe keys/webhook secret:** follow the separate payment cutover procedure and verify one signed sandbox event before touching live values.

After handover, remove developer access, revoke temporary tokens/SSH keys, and have the client set a new mailbox password through Bluehost.
