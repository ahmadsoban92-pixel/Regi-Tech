import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/confirmation/OrderConfirmation";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Order Placed" };

export default function OrderConfirmationPage() {
  return <PageShell><OrderConfirmation /></PageShell>;
}
