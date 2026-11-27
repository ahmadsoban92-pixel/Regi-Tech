"use client";

import Link from "next/link";
import { useActionState } from "react";

import { initialEmailRetryActionState, retryEmailAction } from "@/app/admin/(portal)/emails/actions";
import adminContent from "@/content/admin.json";
import { EMAIL_OUTBOX_KINDS, EMAIL_OUTBOX_STATUSES, type EmailOutboxKind, type EmailOutboxStatus } from "@/lib/emailOutbox";
import type { AdminEmailRow } from "@/services/adminEmails.service";

type Result = {
  deliveries: AdminEmailRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const kindLabels: Record<EmailOutboxKind, string> = {
  order_confirmation: "Order confirmation",
  dispatch_confirmation: "Dispatch confirmation",
  contact_alert: "Contact alert",
};

function date(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function RetryButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(retryEmailAction, initialEmailRetryActionState);
  return (
    <form action={action} className="min-w-32">
      <input name="id" type="hidden" value={id} />
      <button className="admin-primary-action min-h-9 rounded-md bg-[var(--accent)] px-3 text-xs font-semibold text-[#111] disabled:opacity-60" disabled={pending} type="submit">
        {pending ? adminContent.emails.retrying : adminContent.emails.retry}
      </button>
      {state.message ? <p aria-live="polite" className={`mt-1 text-xs ${state.success ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p> : null}
    </form>
  );
}

function pageHref(page: number, filters: { status: EmailOutboxStatus | "all"; kind: EmailOutboxKind | "all" }) {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.kind !== "all") params.set("kind", filters.kind);
  params.set("page", String(page));
  return `/admin/emails?${params}`;
}

export function AdminEmailDelivery({ filters, result }: {
  filters: { status: EmailOutboxStatus | "all"; kind: EmailOutboxKind | "all" };
  result: Result;
}) {
  return (
    <>
      <form className="admin-card mt-6 grid gap-4 rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end" method="get">
        <label className="text-sm font-medium">{adminContent.emails.status}
          <select className="admin-light-field mt-1" defaultValue={filters.status} name="status">
            <option value="all">{adminContent.emails.all}</option>
            {EMAIL_OUTBOX_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">{adminContent.emails.kind}
          <select className="admin-light-field mt-1" defaultValue={filters.kind} name="kind">
            <option value="all">{adminContent.emails.all}</option>
            {EMAIL_OUTBOX_KINDS.map((kind) => <option key={kind} value={kind}>{kindLabels[kind]}</option>)}
          </select>
        </label>
        <button className="admin-primary-action min-h-[42px] rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[#111]" type="submit">{adminContent.emails.apply}</button>
      </form>

      <section className="admin-section-enter mt-6 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">{adminContent.emails.recent}</h2>
          <p className="text-sm text-[#2b2d31]/55">{result.total} {adminContent.emails.total}</p>
        </div>
        {result.deliveries.length ? (
          <ul className="mt-4 grid gap-3">
            {result.deliveries.map((delivery) => (
              <li className="admin-list-row grid gap-3 rounded-md border border-[#e5e7eb] p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center" key={delivery.id}>
                <div className="min-w-0">
                  <p className="font-semibold">{kindLabels[delivery.kind]}</p>
                  <p className="truncate text-sm text-[#2b2d31]/65">{delivery.reference}</p>
                  <p className="mt-1 text-xs text-[#2b2d31]/50">Queued {date(delivery.createdAt)}</p>
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium capitalize text-zinc-700">{delivery.status}</span>
                  <p className="mt-1 text-xs text-[#2b2d31]/55">Attempts: {delivery.attemptCount}</p>
                </div>
                <div className="text-xs text-[#2b2d31]/65">
                  <p>{delivery.status === "sent" ? `Sent ${date(delivery.sentAt)}` : `Next ${date(delivery.nextAttemptAt)}`}</p>
                  {delivery.lastError ? <p className="mt-1 text-red-700">{delivery.lastError}</p> : null}
                </div>
                {delivery.status === "retry" || delivery.status === "failed" ? <RetryButton id={delivery.id} /> : <span className="text-xs text-[#2b2d31]/45">No action needed</span>}
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-sm text-[#2b2d31]/55">{adminContent.emails.empty}</p>}
      </section>

      {result.totalPages > 1 ? (
        <nav aria-label="Email delivery pages" className="mt-4 flex items-center justify-end gap-3 text-sm">
          <Link aria-disabled={result.page === 1} className={`admin-secondary-action rounded border border-[#d6d8dc] px-3 py-2 ${result.page === 1 ? "pointer-events-none opacity-40" : ""}`} href={pageHref(Math.max(1, result.page - 1), filters)}>Previous</Link>
          <span>Page {result.page} of {result.totalPages}</span>
          <Link aria-disabled={result.page === result.totalPages} className={`admin-secondary-action rounded border border-[#d6d8dc] px-3 py-2 ${result.page === result.totalPages ? "pointer-events-none opacity-40" : ""}`} href={pageHref(Math.min(result.totalPages, result.page + 1), filters)}>Next</Link>
        </nav>
      ) : null}
    </>
  );
}
