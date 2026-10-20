import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ payment?: string; reference?: string }> }) {
  const params = await searchParams;
  const cancelledReference = params.payment === "cancelled" ? params.reference : undefined;
  return <PageShell><CheckoutForm cancelledReference={cancelledReference} /></PageShell>;
}
