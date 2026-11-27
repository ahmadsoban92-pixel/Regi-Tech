import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createEmailOutboxScheduler } from "@/lib/emailScheduling";

describe("email outbox scheduling", () => {
  it("runs after the response and never throws into the business flow", async () => {
    const callbacks: Array<() => Promise<void>> = [];
    const processor = vi.fn().mockRejectedValue(new Error("private smtp and recipient detail"));
    const logger = { warn: vi.fn() };
    const schedule = createEmailOutboxScheduler((callback) => callbacks.push(callback), processor, logger);

    expect(() => schedule()).not.toThrow();
    await expect(callbacks[0]()).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith("Background email processing failed.");
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("private smtp");
  });

  it("coalesces repeated scheduling until the pending callback finishes", async () => {
    const callbacks: Array<() => Promise<void>> = [];
    const processor = vi.fn().mockResolvedValue({ claimed: 0, sent: 0, retrying: 0, failed: 0 });
    const schedule = createEmailOutboxScheduler((callback) => callbacks.push(callback), processor, { warn: vi.fn() });

    schedule();
    schedule();
    schedule();
    expect(callbacks).toHaveLength(1);

    await callbacks[0]();
    schedule();
    expect(callbacks).toHaveLength(2);
  });

  it("uses a small bounded processing batch", async () => {
    const callbacks: Array<() => Promise<void>> = [];
    const processor = vi.fn().mockResolvedValue({ claimed: 0, sent: 0, retrying: 0, failed: 0 });
    const schedule = createEmailOutboxScheduler((callback) => callbacks.push(callback), processor, { warn: vi.fn() });

    schedule();
    await callbacks[0]();
    expect(processor).toHaveBeenCalledWith({ limit: 5 });
  });
});
