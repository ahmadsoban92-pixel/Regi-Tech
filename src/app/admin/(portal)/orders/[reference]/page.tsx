import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import adminContent from "@/content/admin.json";
import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";
import { adminFixtureRepository } from "@/services/adminFixture.service";

type AdminOrderPageProps = { params: Promise<{ reference: string }> };

export async function generateMetadata({ params }: AdminOrderPageProps): Promise<Metadata> {
  const { reference } = await params;
  return { title: `Order ${reference}` };
}

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { reference } = await params;
  const order = await adminFixtureRepository.getOrder(reference);
  if (!order) notFound();
  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 md:p-6">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-[#2b2d31]/55"><Link className="hover:text-[#111]" href="/admin/orders">{adminContent.navigation.orders}</Link><ChevronRight aria-hidden size={13} /><span className="font-['Source_Code_Pro'] text-[#111]">{order.reference}</span></nav>
      <AdminOrderDetail order={order} />
    </div>
  );
}
