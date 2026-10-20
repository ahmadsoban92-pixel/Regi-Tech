import type { Metadata } from "next";
import { cookies } from "next/headers";
import { OrderConfirmation } from "@/components/confirmation/OrderConfirmation";
import { PageShell } from "@/components/layout/PageShell";
import { ORDER_ACCESS_COOKIE, readOrderAccess } from "@/lib/orderAccess";
import { getOrderConfirmationBySessionId } from "@/services/order.service";

export const metadata: Metadata = { title: "Order Placed" };

export default async function OrderConfirmationPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  let order = null;
  if (sessionId) {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(ORDER_ACCESS_COOKIE)?.value;
    const separator = cookieValue?.indexOf(".") ?? -1;
    const reference = separator > 0 ? cookieValue!.slice(0, separator) : "";
    const accessToken = reference ? readOrderAccess(cookieValue, reference) : null;
    if (accessToken) order = await getOrderConfirmationBySessionId(sessionId, accessToken).catch(() => null);
  }
  return <PageShell><OrderConfirmation order={order} /></PageShell>;
}
