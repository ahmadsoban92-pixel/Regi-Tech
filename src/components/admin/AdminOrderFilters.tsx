import Link from "next/link";
import { Search } from "lucide-react";
import adminContent from "@/content/admin.json";
import type { AdminOrderFilters } from "@/types/admin";

export function AdminOrderFilters({ filters }: { filters: AdminOrderFilters }) {
  return (
    <form className="admin-card rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm" method="get">
      <label className="relative block" htmlFor="admin-order-search">
        <span className="sr-only">{adminContent.orders.searchPlaceholder}</span>
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2b2d31]/45" size={17} />
        <input className="admin-light-field admin-search-field" defaultValue={filters.query} id="admin-order-search" name="q" placeholder={adminContent.orders.searchPlaceholder} type="search" />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-[#2b2d31]/70">{adminContent.orders.from}<input className="admin-light-field mt-1" defaultValue={filters.from} name="from" type="date" /></label>
        <label className="text-xs text-[#2b2d31]/70">{adminContent.orders.to}<input className="admin-light-field mt-1" defaultValue={filters.to} name="to" type="date" /></label>
        <label className="text-xs text-[#2b2d31]/70">{adminContent.orders.payment}<select className="admin-light-field mt-1" defaultValue={filters.payment} name="payment"><option value="all">{adminContent.orders.all}</option><option value="pending_payment">{adminContent.statuses.pending_payment}</option><option value="paid">{adminContent.statuses.paid}</option><option value="payment_failed">{adminContent.statuses.payment_failed}</option><option value="expired">{adminContent.statuses.expired}</option></select></label>
        <label className="text-xs text-[#2b2d31]/70">{adminContent.orders.fulfilment}<select className="admin-light-field mt-1" defaultValue={filters.fulfilment} name="fulfilment"><option value="all">{adminContent.orders.all}</option><option value="new">{adminContent.statuses.new}</option><option value="in_production">{adminContent.statuses.in_production}</option><option value="dispatched">{adminContent.statuses.dispatched}</option><option value="cancelled">{adminContent.statuses.cancelled}</option></select></label>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3"><Link className="admin-text-link text-xs font-medium" href="/admin/orders">{adminContent.orders.reset}</Link><button className="admin-primary-action rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[#111]" type="submit">{adminContent.orders.apply}</button></div>
    </form>
  );
}
