type RateLimitEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const entries = new Map<string, RateLimitEntry>();

export function checkAddressLookupRateLimit(identifier: string) {
  const now = Date.now();
  if (entries.size > 1_000) {
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(key);
    }
  }
  const current = entries.get(identifier);
  if (!current || current.resetAt <= now) {
    const resetAt = now + WINDOW_MS;
    entries.set(identifier, { count: 1, resetAt });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
