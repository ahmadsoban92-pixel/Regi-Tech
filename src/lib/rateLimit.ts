type RateLimitEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const entries = new Map<string, RateLimitEntry>();

function checkRateLimit(identifier: string, scope: string, maximum: number) {
  const now = Date.now();
  if (entries.size > 1_000) {
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(key);
    }
  }
  const key = `${scope}:${identifier}`;
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + WINDOW_MS;
    entries.set(key, { count: 1, resetAt });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= maximum) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function checkAddressLookupRateLimit(identifier: string) {
  return checkRateLimit(identifier, "address", MAX_REQUESTS);
}

export function checkOrderCheckoutRateLimit(identifier: string) {
  return checkRateLimit(identifier, "checkout", 5);
}

export function checkOrderRetryRateLimit(identifier: string) {
  return checkRateLimit(identifier, "retry", 5);
}
