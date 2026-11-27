import type { Metadata } from "next";

import adminContent from "@/content/admin.json";
import { AdminEmailDelivery } from "@/components/admin/AdminEmailDelivery";
import { EMAIL_OUTBOX_KINDS, EMAIL_OUTBOX_STATUSES, type EmailOutboxKind, type EmailOutboxStatus } from "@/lib/emailOutbox";
import { requireOwner } from "@/services/adminAuth.service";
import { listEmailDeliveries } from "@/services/adminEmails.service";

export const metadata: Metadata = { title: "Email Delivery", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageNumber(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminEmailsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireOwner();
  const params = await searchParams;
  const statusValue = first(params.status);
  const kindValue = first(params.kind);
  const status = EMAIL_OUTBOX_STATUSES.includes(statusValue as EmailOutboxStatus) ? statusValue as EmailOutboxStatus : "all";
  const kind = EMAIL_OUTBOX_KINDS.includes(kindValue as EmailOutboxKind) ? kindValue as EmailOutboxKind : "all";
  const result = await listEmailDeliveries({ status, kind, page: pageNumber(first(params.page)) });
  return (
    <div className="admin-page-enter mx-auto w-full max-w-[1280px] p-4 md:p-6">
      <h1 className="text-2xl font-bold">{adminContent.emails.title}</h1>
      <p className="mt-1 text-sm text-[#2b2d31]/65">{adminContent.emails.intro}</p>
      <AdminEmailDelivery filters={{ status, kind }} result={result} />
    </div>
  );
}
