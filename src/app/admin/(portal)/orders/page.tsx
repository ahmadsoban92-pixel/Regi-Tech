import type { Metadata } from "next";
import adminContent from "@/content/admin.json";
import { AdminOrderFilters } from "@/components/admin/AdminOrderFilters";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { adminFixtureRepository } from "@/services/adminFixture.service";
import type { AdminFulfilmentStatus, AdminOrderFilters as AdminOrderFilterValues } from "@/types/admin";
import type { PaymentStatus } from "@/types/orderApi";

export const metadata: Metadata = { title: "Admin Orders" };

const paymentValues = new Set<PaymentStatus>(["pending_payment", "paid", "payment_failed", "expired"]);
const fulfilmentValues = new Set<AdminFulfilmentStatus>(["new", "in_production", "dispatched", "cancelled"]);

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

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
    fulfilment: fulfilmentValues.has(fulfilment as AdminFulfilmentStatus) ? fulfilment as AdminFulfilmentStatus : "all"
  };
  const orders = await adminFixtureRepository.listOrders(filters);
  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 md:p-6">
      <div className="flex items-baseline gap-8"><h1 className="text-2xl font-bold">{adminContent.orders.title}</h1><p className="text-sm text-[#2b2d31]/55">{orders.length} {orders.length === 1 ? adminContent.orders.countSingular : adminContent.orders.countPlural}</p></div>
      <div className="mt-6"><AdminOrderFilters filters={filters} /></div>
      <div className="mt-5"><AdminOrdersTable orders={orders} /></div>
    </div>
  );
}
