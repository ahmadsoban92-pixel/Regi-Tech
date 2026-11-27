export const EMAIL_OUTBOX_KINDS = [
  "order_confirmation",
  "dispatch_confirmation",
  "contact_alert",
] as const;

export const EMAIL_OUTBOX_STATUSES = [
  "pending",
  "processing",
  "retry",
  "sent",
  "failed",
] as const;

export type EmailOutboxKind = (typeof EMAIL_OUTBOX_KINDS)[number];
export type EmailOutboxStatus = (typeof EMAIL_OUTBOX_STATUSES)[number];

export type EmailOutboxRow = {
  id: string;
  kind: EmailOutboxKind;
  entityId: string;
  deduplicationKey: string;
  status: EmailOutboxStatus;
  attemptCount: number;
  nextAttemptAt: string;
  processingStartedAt: string | null;
  sentAt: string | null;
  lastError: string;
  createdAt: string;
  updatedAt: string;
};

const RETRY_DELAYS_SECONDS = [60, 300, 1_800, 7_200, 21_600, 43_200, 86_400] as const;
const MAX_EMAIL_ATTEMPTS = 8;

export function retryDelaySeconds(attempt: number): number {
  const normalisedAttempt = Number.isFinite(attempt) ? Math.max(1, Math.floor(attempt)) : 1;
  return RETRY_DELAYS_SECONDS[Math.min(normalisedAttempt - 1, RETRY_DELAYS_SECONDS.length - 1)];
}

export function isTerminalEmailAttempt(attempt: number): boolean {
  return attempt >= MAX_EMAIL_ATTEMPTS;
}
