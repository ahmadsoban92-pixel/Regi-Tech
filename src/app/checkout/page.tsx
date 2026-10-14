import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return <PageShell><CheckoutForm /></PageShell>;
}
