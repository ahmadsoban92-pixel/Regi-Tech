"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { OrderCard } from "@/components/order/OrderCard";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";
import content from "@/content/order-confirmation.json";

export function OrderConfirmation() {
  const { config, quantity, resetOrder } = useOrderFlow();
  return (
    <div className="site-container py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center"><CheckCircle2 aria-hidden className="mx-auto text-[var(--success)]" size={34} /><h1 className="page-heading mt-6">{content.title}</h1><p className="mt-3 text-[var(--muted)]">{content.body}</p><p className="mt-4 text-sm">{content.referenceLabel}: <strong className="font-mono">{content.reference}</strong></p></div>
      <div className="mx-auto mt-10 max-w-3xl"><OrderCard config={config} quantity={quantity} /></div>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link className="primary-button" href="/design" onClick={resetOrder}>{content.designAnother}</Link><Link className="secondary-button" href="/contact">{content.contact}</Link></div>
    </div>
  );
}
