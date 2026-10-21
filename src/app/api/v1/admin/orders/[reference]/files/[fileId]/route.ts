import { sendError } from "@/lib/apiResponse";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAdminSession } from "@/services/adminAuth.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeFilename(value: string) {
  return value.replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 180) || "order-file";
}

export async function GET(_request: Request, context: { params: Promise<{ reference: string; fileId: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return sendError("Admin authentication is required.", 401);
  const { reference, fileId } = await context.params;
  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase.from("orders").select("id").eq("reference", reference.toUpperCase()).maybeSingle();
  if (!order) return sendError("File not found.", 404);
  const { data: file, error } = await supabase.from("order_files")
    .select("bucket,object_path,original_name,mime_type")
    .eq("id", fileId)
    .eq("order_id", order.id)
    .maybeSingle();
  if (error || !file) return sendError("File not found.", 404);
  const { data, error: downloadError } = await supabase.storage.from(file.bucket).download(file.object_path);
  if (downloadError || !data) return sendError("The private file is temporarily unavailable.", 502);
  return new Response(await data.arrayBuffer(), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${safeFilename(file.original_name)}"`,
      "Content-Type": file.mime_type,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
