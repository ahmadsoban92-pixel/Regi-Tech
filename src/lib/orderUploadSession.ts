import "server-only";
import { createHash, randomBytes } from "node:crypto";

export const ORDER_UPLOAD_SESSION_COOKIE = "regitech_upload_session";
export const ORDER_UPLOAD_SESSION_MAX_AGE_SECONDS = 2 * 60 * 60;

export function createOrderUploadSession() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashOrderUploadSession(token) };
}

export function hashOrderUploadSession(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isOrderUploadSessionToken(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{40,64}$/.test(value));
}
