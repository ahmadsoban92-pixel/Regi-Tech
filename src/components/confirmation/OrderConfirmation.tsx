"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { OrderCard } from "@/components/order/OrderCard";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";
import content from "@/content/order-confirmation.json";
import type { OrderConfirmationData } from "@/types/orderApi";

export function OrderConfirmation({ order }: { order: OrderConfirmationData | null }) {
  const { resetOrder } = useOrderFlow();
  if (!order) {
    return (
      <div className="site-container py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center"><h1 className="page-heading">{content.unavailableTitle}</h1><p className="mt-3 text-[var(--muted)]">{content.unavailableBody}</p></div>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link className="secondary-button" href="/contact">{content.contact}</Link></div>
      </div>
    );
  }
  const paid = order.paymentStatus === "paid";
  const failed = order.paymentStatus === "payment_failed" || order.paymentStatus === "expired";
  const title = paid ? content.title : failed ? content.failedTitle : content.pendingTitle;
  const body = paid ? content.paidBody : failed ? content.failedBody : content.pendingBody;
  return (
    <div className="site-container py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">{paid ? <CheckCircle2 aria-hidden className="mx-auto text-[var(--success)]" size={34} /> : null}<h1 className={`page-heading ${paid ? "mt-6" : ""}`}>{title}</h1><p className="mt-3 text-[var(--muted)]">{body}</p>{order.verificationStatus === "pending" ? <p className="mt-3 text-sm text-[var(--muted)]">{content.verificationPending}</p> : null}<p className="mt-4 text-sm">{content.referenceLabel}: <strong className="font-mono">{order.reference}</strong></p></div>
      <div className="mx-auto mt-10 max-w-3xl space-y-5">{order.items.map((item) => <OrderCard config={item.config} key={item.id} persistedPriceBreakdown={item.priceBreakdown} persistedTotalPence={item.lineTotalPence} quantity={item.quantity} />)}{order.orderNotes ? <div className="panel p-5"><h2 className="text-sm font-semibold">{content.orderNotes}</h2><p className="mt-2 text-sm text-[var(--muted)]">{order.orderNotes}</p></div> : null}<dl className="panel space-y-2 p-5 text-sm"><div className="flex justify-between text-[var(--muted)]"><dt>{content.subtotal}</dt><dd>£{(order.subtotalPence / 100).toFixed(2)}</dd></div><div className="flex justify-between text-[var(--muted)]"><dt>{content.delivery}</dt><dd className="rounded bg-[var(--accent)] px-1.5 font-bold text-[var(--foreground-on-light)]">{content.free}</dd></div><div className="flex justify-between border-t border-[var(--line)] pt-3 font-bold"><dt>{content.total}</dt><dd>£{(order.totalPence / 100).toFixed(2)}</dd></div></dl></div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{failed ? <Link className="primary-button" href={`/checkout?payment=cancelled&reference=${encodeURIComponent(order.reference)}`}>{content.returnToCheckout}</Link> : <Link className="primary-button" href="/design" onClick={resetOrder}>{content.designAnother}</Link>}<Link className="secondary-button" href="/contact">{content.contact}</Link></div>
    </div>
  );
}
