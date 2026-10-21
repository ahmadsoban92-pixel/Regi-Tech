import type { NextRequest } from "next/server";
import { sendCreated, sendError } from "@/lib/apiResponse";
import { contactSubmissionSchema } from "@/lib/contactSchemas";
import { ServerConfigurationError } from "@/lib/env";
import { checkContactRateLimit } from "@/lib/rateLimit";
import { getRequestIdentifier } from "@/lib/request";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkContactRateLimit(getRequestIdentifier(request));
    if (!rateLimit.allowed) {
      const response = sendError("Too many messages have been sent. Please wait before trying again.", 429);
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }
    const parsed = contactSubmissionSchema.safeParse(await request.json());
    if (!parsed.success) return sendError("Check the highlighted fields and try again.", 400, parsed.error.flatten().fieldErrors);
    if (parsed.data.website) return sendCreated({ received: true }, "Message received.");
    const { error } = await getSupabaseAdmin().from("contact_submissions").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      order_reference: parsed.data.reference,
      message: parsed.data.message,
    });
    if (error) throw error;
    return sendCreated({ received: true }, "Thanks — your message has been received.");
  } catch (error) {
    if (error instanceof ServerConfigurationError) return sendError("The contact form is not configured yet. Please use email or WhatsApp.", 503);
    if (error instanceof SyntaxError) return sendError("The request body is not valid JSON.", 400);
    console.error("Contact submission failed", error);
    return sendError("We could not send your message. Please use email or WhatsApp instead.", 502);
  }
}
