import { describe, expect, it } from "vitest";

import {
  EMAIL_OUTBOX_KINDS,
  EMAIL_OUTBOX_STATUSES,
  isTerminalEmailAttempt,
  retryDelaySeconds,
} from "@/lib/emailOutbox";

describe("email outbox policy", () => {
  it("uses the approved retry schedule", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(retryDelaySeconds)).toEqual([
      60,
      300,
      1_800,
      7_200,
      21_600,
      43_200,
      86_400,
    ]);
  });

  it("caps attempts beyond the retry schedule", () => {
    expect(retryDelaySeconds(8)).toBe(86_400);
    expect(retryDelaySeconds(99)).toBe(86_400);
  });

  it("treats attempt eight as terminal", () => {
    expect(isTerminalEmailAttempt(7)).toBe(false);
    expect(isTerminalEmailAttempt(8)).toBe(true);
    expect(isTerminalEmailAttempt(12)).toBe(true);
  });

  it("exports only the supported kinds and statuses", () => {
    expect(EMAIL_OUTBOX_KINDS).toEqual([
      "order_confirmation",
      "dispatch_confirmation",
      "contact_alert",
    ]);
    expect(EMAIL_OUTBOX_STATUSES).toEqual([
      "pending",
      "processing",
      "retry",
      "sent",
      "failed",
    ]);
  });
});
