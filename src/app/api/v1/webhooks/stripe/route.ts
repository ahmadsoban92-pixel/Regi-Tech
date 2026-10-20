import { sendError, sendSuccess } from "@/lib/apiResponse";
import { getOrderServerEnv, ServerConfigurationError } from "@/lib/env";
import { getStripeClient } from "@/lib/stripeClient";
import { applyStripeCheckoutEvent } from "@/services/order.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return sendError("Missing Stripe signature.", 400);
    const body = await request.text();
    const event = getStripeClient().webhooks.constructEvent(body, signature, getOrderServerEnv().stripeWebhookSecret);
    const result = await applyStripeCheckoutEvent(event);
    return sendSuccess(result, result.ignored ? "Event ignored." : "Event received.");
  } catch (error) {
    if (error instanceof ServerConfigurationError) return sendError("Stripe webhook handling is not configured.", 503);
    if (error instanceof Error && /signature/i.test(error.message)) return sendError("Invalid Stripe signature.", 400);
    console.error("Stripe webhook failed", error);
    return sendError("Unable to process the Stripe event.", 500);
  }
}
