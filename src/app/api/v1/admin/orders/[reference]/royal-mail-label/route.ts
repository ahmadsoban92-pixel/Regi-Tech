import { sendError } from "@/lib/apiResponse";
import { adminRepository } from "@/services/admin.service";
import { getAdminSession } from "@/services/adminAuth.service";
import { downloadRoyalMailLabel } from "@/services/royalMailShipment.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!await getAdminSession()) return sendError("Admin authentication is required.", 401);
  const { reference } = await context.params;
  const order = await adminRepository.getOrder(reference);
  if (!order) return sendError("Order not found.", 404);
  try {
    const bytes = await downloadRoyalMailLabel(order);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${order.reference.replace(/[^A-Za-z0-9_-]/g, "_")}-royal-mail-label.pdf"`,
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return sendError("The Royal Mail label is temporarily unavailable.", 502);
  }
}
