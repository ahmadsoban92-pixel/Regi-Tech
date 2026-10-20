import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const ORDER_ACCESS_COOKIE = "regitech_order_access";
export const ORDER_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function createOrderAccess(reference: string) {
  const token = randomBytes(32).toString("base64url");
  return {
    cookieValue: `${reference}.${token}`,
    tokenHash: hashOrderAccessToken(token),
  };
}

export function hashOrderAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readOrderAccess(cookieValue: string | undefined, expectedReference: string) {
  if (!cookieValue) return null;
  const separator = cookieValue.indexOf(".");
  if (separator < 1) return null;
  const reference = cookieValue.slice(0, separator);
  const token = cookieValue.slice(separator + 1);
  return reference === expectedReference && token ? token : null;
}

export function verifyOrderAccessToken(token: string, expectedHash: string) {
  const actual = Buffer.from(hashOrderAccessToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
