import type { NextRequest } from "next/server";
import { sendCreated, sendError } from "@/lib/apiResponse";
import { ServerConfigurationError } from "@/lib/env";
import { ORDER_ACCESS_COOKIE, ORDER_ACCESS_MAX_AGE_SECONDS } from "@/lib/orderAccess";
import { validateOrderFile } from "@/lib/orderFiles";
import { ORDER_PAYLOAD_MAX_BYTES } from "@/lib/formLimits";
import { checkOrderCheckoutRateLimit } from "@/lib/rateLimit";
import { getRequestIdentifier } from "@/lib/request";
import { createCheckoutOrder } from "@/services/order.service";
import { OrderValidationError, parseCheckoutSubmission } from "@/services/orderValidation.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function asFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkOrderCheckoutRateLimit(getRequestIdentifier(request));
  if (!rateLimit.allowed) {
    const response = sendError("Too many checkout attempts. Please wait a moment and try again.", 429);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  try {
    const formData = await request.formData();
    const rawOrder = formData.get("order");
    if (typeof rawOrder !== "string" || Buffer.byteLength(rawOrder, "utf8") > ORDER_PAYLOAD_MAX_BYTES) {
      return sendError("The order payload is missing or too large.", 400);
    }
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawOrder);
    } catch {
      return sendError("The order payload is not valid JSON.", 400);
    }
    const submission = parseCheckoutSubmission(parsedJson);
    const itemIds = new Set(submission.items.map((item) => item.id));
    const fileEntries = [...formData.entries()].filter((entry): entry is [string, File] => entry[1] instanceof File && entry[1].size > 0);
    for (const [key] of fileEntries) {
      const match = /^(v5c|artwork)-([A-Za-z0-9-]{1,64})$/.exec(key);
      if (!match || !itemIds.has(match[2])) return sendError("An uploaded file is not associated with a valid cart line.", 400);
    }
    const filesByItemId = Object.fromEntries(await Promise.all(submission.items.map(async (item) => {
      const v5cInput = asFile(formData.get(`v5c-${item.id}`));
      const artworkInput = asFile(formData.get(`artwork-${item.id}`));
      const [v5c, artwork] = await Promise.all([
        v5cInput ? validateOrderFile(v5cInput, "v5c") : Promise.resolve(null),
        artworkInput ? validateOrderFile(artworkInput, "artwork") : Promise.resolve(null),
      ]);
      return [item.id, { artwork, v5c }] as const;
    })));
    const result = await createCheckoutOrder(submission, filesByItemId);
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
