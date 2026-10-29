import Link from "next/link";
import { Eye } from "lucide-react";
import adminContent from "@/content/admin.json";
import { formatAdminDate, formatAdminMoney, summarizeProducts, summarizeRegistrations } from "@/lib/adminFormatting";
import type { AdminOrder } from "@/types/admin";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export function AdminOrdersTable({ compact = false, orders }: { compact?: boolean; orders: AdminOrder[] }) {
  if (!orders.length) return <div className="rounded-lg border border-[#e5e7eb] px-5 py-10 text-center text-sm text-[#2b2d31]/65">{adminContent.orders.empty}</div>;

  return (
    <>
      <div className="admin-card hidden overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead className="bg-[#f2f3f5] text-[0.6875rem] font-bold uppercase tracking-[0.03em] text-[#2b2d31]/70">
              <tr>
                <th className="px-3 py-3">{adminContent.table.order}</th>
                <th className="px-3 py-3">{adminContent.table.date}</th>
                <th className="px-3 py-3">{adminContent.table.customer}</th>
                <th className="px-3 py-3">{adminContent.table.registration}</th>
                {compact ? null : <th className="px-3 py-3">{adminContent.table.product}</th>}
                <th className="px-3 py-3 text-right">{adminContent.table.total}</th>
                <th className="px-3 py-3">{adminContent.table.payment}</th>
                <th className="px-3 py-3">{adminContent.table.fulfilment}</th>
                <th className="px-3 py-3"><span className="sr-only">{adminContent.table.view}</span></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const configs = order.items.map((item) => item.config);
                return (
                  <tr className="admin-table-row border-t border-[#e5e7eb] text-[#111]" key={order.id}>
                    <td className="px-3 py-3 font-['Source_Code_Pro'] font-semibold"><Link className="admin-text-link" href={`/admin/orders/${order.reference}`}>{order.reference}</Link></td>
                    <td className="px-3 py-3 text-[#2b2d31]/80">{formatAdminDate(order.createdAt)}</td>
                    <td className="px-3 py-3"><span className="block">{order.customer.firstName} {order.customer.lastName}</span>{compact ? null : <span className="block text-xs text-[#2b2d31]/50">{order.customer.email}</span>}</td>
                    <td className="px-3 py-3 font-['Source_Code_Pro'] text-[#2b2d31]">{summarizeRegistrations(configs)}</td>
                    {compact ? null : <td className="max-w-[180px] px-3 py-3 leading-5">{summarizeProducts(configs)}</td>}
                    <td className="px-3 py-3 text-right font-semibold">{formatAdminMoney(order.totalPence)}</td>
                    <td className="px-3 py-3"><AdminStatusBadge status={order.paymentStatus} /></td>
                    <td className="px-3 py-3"><AdminStatusBadge status={order.fulfilmentStatus} /></td>
                    <td className="px-3 py-3 text-right"><Link aria-label={`${adminContent.table.view} ${order.reference}`} className="admin-view-link inline-flex items-center gap-1 font-medium" href={`/admin/orders/${order.reference}`}><Eye aria-hidden size={15} />{compact ? adminContent.table.view : <span className="sr-only">{adminContent.table.view}</span>}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {orders.map((order) => {
          const configs = order.items.map((item) => item.config);
          return (
            <article className="admin-card rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm" key={order.id}>
              <div className="flex items-start justify-between gap-3"><div><Link className="admin-text-link font-['Source_Code_Pro'] font-semibold" href={`/admin/orders/${order.reference}`}>{order.reference}</Link><p className="mt-1 text-xs text-[#2b2d31]/60">{formatAdminDate(order.createdAt)}</p></div><strong>{formatAdminMoney(order.totalPence)}</strong></div>
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-xs"><div><span className="block text-[#2b2d31]/50">{adminContent.table.customer}</span><span>{order.customer.firstName} {order.customer.lastName}</span></div><div><span className="block text-[#2b2d31]/50">{adminContent.table.registration}</span><span className="font-['Source_Code_Pro']">{summarizeRegistrations(configs)}</span></div>{compact ? null : <div className="col-span-2"><span className="block text-[#2b2d31]/50">{adminContent.table.product}</span><span>{summarizeProducts(configs)}</span></div>}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2"><AdminStatusBadge status={order.paymentStatus} /><AdminStatusBadge status={order.fulfilmentStatus} /><Link className="admin-view-link ml-auto inline-flex items-center gap-1 text-sm font-medium" href={`/admin/orders/${order.reference}`}><Eye aria-hidden size={15} />{adminContent.table.view}</Link></div>
            </article>
          );
        })}
      </div>
    </>
  );
}
