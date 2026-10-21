import type { NextRequest } from "next/server";
import { sendCreated, sendError } from "@/lib/apiResponse";
import { ServerConfigurationError } from "@/lib/env";
import { orderUploadRequestSchema } from "@/lib/orderSchemas";
import { createOrderUploadSession, hashOrderUploadSession, isOrderUploadSessionToken, ORDER_UPLOAD_SESSION_COOKIE, ORDER_UPLOAD_SESSION_MAX_AGE_SECONDS } from "@/lib/orderUploadSession";
import { checkOrderUploadRateLimit } from "@/lib/rateLimit";
import { getRequestIdentifier } from "@/lib/request";
import { createPendingOrderUpload } from "@/services/orderUpload.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkOrderUploadRateLimit(getRequestIdentifier(request));
    if (!rateLimit.allowed) {
      const response = sendError("Too many upload attempts. Please wait before trying again.", 429);
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }
    const parsed = orderUploadRequestSchema.safeParse(await request.json());
    if (!parsed.success) return sendError("Check the selected file and try again.", 400, parsed.error.flatten().fieldErrors);
    const existing = request.cookies.get(ORDER_UPLOAD_SESSION_COOKIE)?.value;
    const session = isOrderUploadSessionToken(existing) ? { token: existing, hash: hashOrderUploadSession(existing) } : createOrderUploadSession();
    const upload = await createPendingOrderUpload(parsed.data, session.hash);
    const response = sendCreated(upload, "Private upload prepared.");
    if (!isOrderUploadSessionToken(existing)) response.cookies.set(ORDER_UPLOAD_SESSION_COOKIE, session.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: ORDER_UPLOAD_SESSION_MAX_AGE_SECONDS });
    return response;
  } catch (error) {
    if (error instanceof ServerConfigurationError) return sendError("Private uploads are not configured yet.", 503);
    if (error instanceof SyntaxError) return sendError("The request body is not valid JSON.", 400);
    console.error("Order upload preparation failed", error);
    return sendError(error instanceof Error ? error.message : "The private upload could not be prepared.", 502);
  }
}
