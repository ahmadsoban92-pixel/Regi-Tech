import { sendError, sendSuccess } from "@/lib/apiResponse";
import { verifyWorkerAuthorization } from "@/lib/emailWorkerAuthorization";
import { getEmailServerEnv, ServerConfigurationError } from "@/lib/env";
import { processEmailOutbox } from "@/services/emailOutbox.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { workerSecret } = getEmailServerEnv();
    if (!verifyWorkerAuthorization(request.headers.get("authorization"), workerSecret)) {
      return sendError("Unauthorized.", 401);
    }
    const result = await processEmailOutbox({ limit: 10 });
    return sendSuccess(result, "Email outbox processed.");
  } catch (error) {
    if (error instanceof ServerConfigurationError) return sendError("Email delivery is not configured.", 503);
    console.error("Email outbox processing failed.");
    return sendError("Unable to process the email outbox.", 500);
  }
}
