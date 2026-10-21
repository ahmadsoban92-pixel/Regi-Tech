import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabasePublicEnv, getSupabaseServerEnv } from "@/lib/env";
import { validateStoredOrderFile, type ValidatedOrderFile } from "@/lib/orderFiles";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { OrderUploadRequestValues } from "@/lib/orderSchemas";

export type ResolvedOrderUpload = {
  id: string;
  cartItemId: string;
  kind: "v5c" | "artwork";
  bucket: "v5c-documents" | "order-artwork";
  objectPath: string;
  file: ValidatedOrderFile;
};

const EXTENSIONS: Record<OrderUploadRequestValues["mimeType"], string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
};

export async function cleanupExpiredPendingUploads() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("pending_order_uploads")
    .select("id,bucket,object_path")
    .is("claimed_at", null)
    .lte("expires_at", new Date().toISOString())
    .limit(20);
  if (!data?.length) return;
  await Promise.all(data.map((item) => supabase.storage.from(item.bucket).remove([item.object_path])));
  await supabase.from("pending_order_uploads").delete().in("id", data.map((item) => item.id));
}

export async function createPendingOrderUpload(input: OrderUploadRequestValues, sessionHash: string) {
  await cleanupExpiredPendingUploads().catch(() => undefined);
  const supabase = getSupabaseAdmin();
  const id = randomUUID();
  const bucket = input.kind === "v5c" ? "v5c-documents" : "order-artwork";
  const objectPath = `pending/${id}.${EXTENSIONS[input.mimeType]}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const { error: insertError } = await supabase.from("pending_order_uploads").insert({
    id,
    session_hash: sessionHash,
    cart_item_id: input.cartItemId,
    kind: input.kind,
    bucket,
    object_path: objectPath,
    original_name: input.filename,
    mime_type: input.mimeType,
    size_bytes: input.size,
    expires_at: expiresAt,
  });
  if (insertError) throw new Error("Unable to prepare the private upload.");
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(objectPath, { upsert: false });
  if (error || !data?.token) {
    await supabase.from("pending_order_uploads").delete().eq("id", id);
    throw new Error("Unable to authorize the private upload.");
  }
  const projectUrl = new URL(getSupabaseServerEnv().supabaseUrl);
  const projectRef = projectUrl.hostname.split(".")[0];
  return {
    uploadId: id,
    bucket,
    objectPath,
    token: data.token,
    apiKey: getSupabasePublicEnv().supabasePublishableKey,
    endpoint: `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable/sign`,
    expiresAt,
  };
}

export async function resolvePendingOrderUploads(uploadIds: string[], sessionHash: string) {
  if (!uploadIds.length) return new Map<string, ResolvedOrderUpload>();
  const unique = [...new Set(uploadIds)];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("pending_order_uploads")
    .select("id,cart_item_id,kind,bucket,object_path,original_name,mime_type,size_bytes")
    .in("id", unique)
    .eq("session_hash", sessionHash)
    .is("claimed_at", null)
    .gt("expires_at", new Date().toISOString());
  if (error || data?.length !== unique.length) throw new Error("One or more uploads are missing, expired or belong to another checkout session.");

  const resolved = new Map<string, ResolvedOrderUpload>();
  for (const row of data) {
    const { data: blob, error: downloadError } = await supabase.storage.from(row.bucket).download(row.object_path);
    if (downloadError || !blob) throw new Error("An uploaded file could not be verified. Please upload it again.");
    const bytes = Buffer.from(await blob.arrayBuffer());
    const file = validateStoredOrderFile({ bytes, originalName: row.original_name, size: row.size_bytes }, row.kind as "v5c" | "artwork");
    if (file.mimeType !== row.mime_type) throw new Error("An uploaded file type does not match its content.");
    resolved.set(row.id, {
      id: row.id,
      cartItemId: row.cart_item_id,
      kind: row.kind as "v5c" | "artwork",
      bucket: row.bucket as "v5c-documents" | "order-artwork",
      objectPath: row.object_path,
      file,
    });
  }
  return resolved;
}
