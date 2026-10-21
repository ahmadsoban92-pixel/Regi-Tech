import type { Metadata } from "next";
import adminContent from "@/content/admin.json";
import { AdminOrderFilters } from "@/components/admin/AdminOrderFilters";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { adminRepository } from "@/services/admin.service";
import type { AdminFulfilmentStatus, AdminOrderFilters as AdminOrderFilterValues } from "@/types/admin";
import type { PaymentStatus } from "@/types/orderApi";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin Orders" };

const paymentValues = new Set<PaymentStatus>(["pending_payment", "paid", "payment_failed", "expired"]);
const fulfilmentValues = new Set<AdminFulfilmentStatus>(["new", "in_production", "dispatched", "cancelled"]);

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }
function pageNumber(value: string) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : 1; }

type AdminOrdersPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const payment = first(params.payment);
  const fulfilment = first(params.fulfilment);
  const filters: AdminOrderFilterValues = {
    query: first(params.q),
    from: first(params.from),
    to: first(params.to),
    payment: paymentValues.has(payment as PaymentStatus) ? payment as PaymentStatus : "all",
    fulfilment: fulfilmentValues.has(fulfilment as AdminFulfilmentStatus) ? fulfilment as AdminFulfilmentStatus : "all",
    page: pageNumber(first(params.page)),
  };
  const result = await adminRepository.listOrders(filters);
  const pageHref = (page: number) => { const next = new URLSearchParams(); if (filters.query) next.set("q", filters.query); if (filters.from) next.set("from", filters.from); if (filters.to) next.set("to", filters.to); if (filters.payment !== "all") next.set("payment", filters.payment); if (filters.fulfilment !== "all") next.set("fulfilment", filters.fulfilment); next.set("page", String(page)); return `/admin/orders?${next}`; };
  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 md:p-6">
      <div className="flex items-baseline gap-8"><h1 className="text-2xl font-bold">{adminContent.orders.title}</h1><p className="text-sm text-[#2b2d31]/55">{result.total} {result.total === 1 ? adminContent.orders.countSingular : adminContent.orders.countPlural}</p></div>
      <div className="mt-6"><AdminOrderFilters filters={filters} /></div>
      <div className="mt-5"><AdminOrdersTable orders={result.orders} /></div>
      {result.totalPages > 1 ? <nav aria-label="Order pages" className="mt-4 flex items-center justify-end gap-3 text-sm"><Link aria-disabled={result.page === 1} className={`rounded border border-[#d6d8dc] px-3 py-2 ${result.page === 1 ? "pointer-events-none opacity-40" : ""}`} href={pageHref(Math.max(1, result.page - 1))}>Previous</Link><span>Page {result.page} of {result.totalPages}</span><Link aria-disabled={result.page === result.totalPages} className={`rounded border border-[#d6d8dc] px-3 py-2 ${result.page === result.totalPages ? "pointer-events-none opacity-40" : ""}`} href={pageHref(Math.min(result.totalPages, result.page + 1))}>Next</Link></nav> : null}
    </div>
  );
}
