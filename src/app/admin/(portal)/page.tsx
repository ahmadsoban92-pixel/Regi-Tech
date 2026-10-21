import type { Metadata } from "next";
import Link from "next/link";
import { PackageCheck, PoundSterling, ShieldCheck, ShoppingCart } from "lucide-react";
import adminContent from "@/content/admin.json";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { formatAdminMoney } from "@/lib/adminFormatting";
import { adminRepository } from "@/services/admin.service";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const { metrics, latestOrders } = await adminRepository.getDashboard();
  const cards = [
    { label: adminContent.dashboard.metrics.total, value: String(metrics.totalOrders), icon: ShoppingCart },
    { label: adminContent.dashboard.metrics.fulfilment, value: String(metrics.awaitingFulfilment), icon: PackageCheck },
    { label: adminContent.dashboard.metrics.verification, value: String(metrics.awaitingVerification), icon: ShieldCheck },
    { label: adminContent.dashboard.metrics.value, value: formatAdminMoney(metrics.paidOrderValuePence), icon: PoundSterling }
  ];
  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 md:p-6">
      <h1 className="text-2xl font-bold">{adminContent.dashboard.title}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm" key={label}><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-[#2b2d31]/65">{label}</p><Icon aria-hidden className="text-[#2b2d31]/55" size={20} strokeWidth={1.7} /></div><p className="mt-2 text-2xl font-extrabold">{value}</p></section>)}</div>
      <section className="mt-6"><div className="flex items-center justify-between rounded-t-lg border border-b-0 border-[#e5e7eb] bg-white p-4"><h2 className="font-semibold">{adminContent.dashboard.latest}</h2><Link className="text-sm font-medium hover:underline" href="/admin/orders">{adminContent.dashboard.viewAll}</Link></div><div className="[&>div:first-child]:rounded-t-none"><AdminOrdersTable compact orders={latestOrders} /></div></section>
    </div>
  );
}
