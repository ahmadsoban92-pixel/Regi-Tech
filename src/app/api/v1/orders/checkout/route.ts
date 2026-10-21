import type { NextRequest } from "next/server";
import { sendCreated, sendError } from "@/lib/apiResponse";
import { ServerConfigurationError } from "@/lib/env";
import { ORDER_ACCESS_COOKIE, ORDER_ACCESS_MAX_AGE_SECONDS } from "@/lib/orderAccess";
import { ORDER_PAYLOAD_MAX_BYTES } from "@/lib/formLimits";
import { hashOrderUploadSession, isOrderUploadSessionToken, ORDER_UPLOAD_SESSION_COOKIE } from "@/lib/orderUploadSession";
import { checkOrderCheckoutRateLimit } from "@/lib/rateLimit";
import { getRequestIdentifier } from "@/lib/request";
import { createCheckoutOrder } from "@/services/order.service";
import { OrderValidationError, parseCheckoutSubmission } from "@/services/orderValidation.service";
import { resolvePendingOrderUploads } from "@/services/orderUpload.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkOrderCheckoutRateLimit(getRequestIdentifier(request));
    if (!rateLimit.allowed) {
      const response = sendError("Too many checkout attempts. Please wait a moment and try again.", 429);
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }
    const rawOrder = await request.text();
    if (!rawOrder || Buffer.byteLength(rawOrder, "utf8") > ORDER_PAYLOAD_MAX_BYTES) {
      return sendError("The order payload is missing or too large.", 400);
    }
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawOrder);
    } catch {
      return sendError("The order payload is not valid JSON.", 400);
    }
    const submission = parseCheckoutSubmission(parsedJson);
    const uploadIds = submission.items.flatMap((item) => [item.v5cUploadId, item.artworkUploadId]).filter((value): value is string => Boolean(value));
    if (new Set(uploadIds).size !== uploadIds.length) return sendError("Each private upload can only be used once.", 400);
    const uploadToken = request.cookies.get(ORDER_UPLOAD_SESSION_COOKIE)?.value;
    if (uploadIds.length && !isOrderUploadSessionToken(uploadToken)) return sendError("The private upload session is missing or expired.", 401);
    const uploadSessionHash = uploadToken ? hashOrderUploadSession(uploadToken) : "";
    const uploads = await resolvePendingOrderUploads(uploadIds, uploadSessionHash);
    const filesByItemId = Object.fromEntries(submission.items.map((item) => {
      const v5c = item.v5cUploadId ? uploads.get(item.v5cUploadId) ?? null : null;
      const artwork = item.artworkUploadId ? uploads.get(item.artworkUploadId) ?? null : null;
      if (v5c && (v5c.cartItemId !== item.id || v5c.kind !== "v5c")) throw new OrderValidationError("A V5C upload is not associated with the correct cart line.");
      if (artwork && (artwork.cartItemId !== item.id || artwork.kind !== "artwork")) throw new OrderValidationError("An artwork upload is not associated with the correct cart line.");
      return [item.id, { artwork, v5c }];
    }));
    const result = await createCheckoutOrder(submission, filesByItemId, uploadSessionHash);
    const response = sendCreated({ reference: result.reference, checkoutUrl: result.checkoutUrl }, "Checkout session created.");
    response.cookies.set(ORDER_ACCESS_COOKIE, result.cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ORDER_ACCESS_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof OrderValidationError) return sendError(error.message, 400, error.errors);
    if (error instanceof ServerConfigurationError) return sendError("Secure checkout is not configured yet. Please contact our team.", 503);
    if (error instanceof Error && /10 MB|Upload a|file name|empty/i.test(error.message)) return sendError(error.message, 400);
    console.error("Checkout creation failed", error);
    return sendError("Secure checkout is temporarily unavailable. Your card has not been charged.", 502);
  }
}
