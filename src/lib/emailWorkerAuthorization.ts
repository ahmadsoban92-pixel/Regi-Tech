import { timingSafeEqual } from "node:crypto";

export function verifyWorkerAuthorization(authorization: string | null, secret: string): boolean {
  if (!authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice("Bearer ".length), "utf8");
  const expected = Buffer.from(secret, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
