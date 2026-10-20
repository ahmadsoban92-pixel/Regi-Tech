import type { NextRequest } from "next/server";
import { sendError, sendSuccess } from "@/lib/apiResponse";
import { ServerConfigurationError } from "@/lib/env";
import { ORDER_ACCESS_COOKIE, readOrderAccess } from "@/lib/orderAccess";
import { checkOrderRetryRateLimit } from "@/lib/rateLimit";
import { getRequestIdentifier } from "@/lib/request";
import { retryCheckoutOrder } from "@/services/order.service";
import { OrderValidationError } from "@/services/orderValidation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest, context: RouteContext<"/api/v1/orders/[reference]/retry">) {
  const { reference } = await context.params;
  const rateLimit = checkOrderRetryRateLimit(getRequestIdentifier(request));
  if (!rateLimit.allowed) {
    const response = sendError("Too many payment retries. Please wait a moment and try again.", 429);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }
  const accessToken = readOrderAccess(request.cookies.get(ORDER_ACCESS_COOKIE)?.value, reference);
  if (!accessToken) return sendError("The checkout session is no longer available.", 401);
  try {
    const result = await retryCheckoutOrder(reference, accessToken);
    return sendSuccess(result, "Payment retry created.");
  } catch (error) {
    if (error instanceof OrderValidationError) return sendError(error.message, 400);
    if (error instanceof ServerConfigurationError) return sendError("Secure checkout is not configured yet. Please contact our team.", 503);
    console.error("Checkout retry failed", error);
    return sendError("Secure checkout is temporarily unavailable. Your card has not been charged.", 502);
  }
}
