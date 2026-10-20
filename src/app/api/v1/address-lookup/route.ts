import type { NextRequest } from "next/server";
import { sendError, sendSuccess } from "@/lib/apiResponse";
import { addressLookupQuerySchema } from "@/lib/orderSchemas";
import { checkAddressLookupRateLimit } from "@/lib/rateLimit";
import { getRequestIdentifier } from "@/lib/request";
import { AddressLookupConfigurationError, findAddressesByPostcode } from "@/services/addressLookup.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = addressLookupQuerySchema.safeParse({
    postcode: request.nextUrl.searchParams.get("postcode") ?? "",
    page: request.nextUrl.searchParams.get("page") ?? "0",
  });

  if (!query.success) return sendError("Check the postcode and try again.", 400, query.error.flatten().fieldErrors);

  const rateLimit = checkAddressLookupRateLimit(getRequestIdentifier(request));
  if (!rateLimit.allowed) {
    const response = sendError("Too many address searches. Please try again shortly.", 429);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  try {
    const result = await findAddressesByPostcode(query.data.postcode, query.data.page);
    return sendSuccess(result, result.addresses.length ? "Addresses found." : "No addresses found.");
  } catch (error) {
    if (error instanceof AddressLookupConfigurationError) return sendError("Address lookup is temporarily unavailable. Enter the address manually.", 503);
    console.error("Address lookup failed", error);
    return sendError("Address lookup is temporarily unavailable. Enter the address manually.", 502);
  }
}
