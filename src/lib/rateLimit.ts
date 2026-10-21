import "server-only";
import { createHmac } from "node:crypto";
import { getRateLimitEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

const LIMITS = {
  address: { maximum: 10, windowSeconds: 60 },
  checkout: { maximum: 5, windowSeconds: 60 },
  retry: { maximum: 5, windowSeconds: 60 },
  contact: { maximum: 5, windowSeconds: 15 * 60 },
  adminLogin: { maximum: 10, windowSeconds: 15 * 60 },
  upload: { maximum: 60, windowSeconds: 15 * 60 },
} as const;

function hashIdentifier(identifier: string) {
  return createHmac("sha256", getRateLimitEnv().rateLimitHmacKey)
    .update(identifier || "unknown")
    .digest("hex");
}

async function checkRateLimit(identifier: string, scope: keyof typeof LIMITS): Promise<RateLimitResult> {
  const limit = LIMITS[scope];
  const { data, error } = await getSupabaseAdmin().rpc("check_api_rate_limit", {
    p_scope: scope,
    p_identifier_hash: hashIdentifier(identifier),
    p_window_seconds: limit.windowSeconds,
    p_max_requests: limit.maximum,
  });
  if (error || !data?.[0]) throw new Error("Unable to enforce the request rate limit.");
  return { allowed: data[0].allowed, retryAfterSeconds: data[0].retry_after_seconds };
}

export const checkAddressLookupRateLimit = (identifier: string) => checkRateLimit(identifier, "address");
export const checkOrderCheckoutRateLimit = (identifier: string) => checkRateLimit(identifier, "checkout");
export const checkOrderRetryRateLimit = (identifier: string) => checkRateLimit(identifier, "retry");
export const checkContactRateLimit = (identifier: string) => checkRateLimit(identifier, "contact");
export const checkAdminLoginRateLimit = (identifier: string) => checkRateLimit(identifier, "adminLogin");
export const checkOrderUploadRateLimit = (identifier: string) => checkRateLimit(identifier, "upload");
