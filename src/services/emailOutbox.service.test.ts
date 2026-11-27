import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { EmailMessage } from "@/lib/emailMessages";
import type { EmailOutboxRow } from "@/lib/emailOutbox";
import {
  createEmailOutboxProcessor,
  type EmailOutboxRepository,
  type OrderEmailRecord,
} from "@/services/emailOutbox.service";

const order: OrderEmailRecord = {
  reference: "RT-10000001",
  customer: { firstName: "Alex", lastName: "Rider", email: "alex@example.com" },
  items: [{ productName: "Crystal 3D", registration: "AB12 CDE", quantity: 1, lineTotalPence: 2499, useType: "show" }],
  subtotalPence: 2499,
  deliveryPence: 0,
  discountPence: 0,
  totalPence: 2499,
  createdAt: "2026-11-27T09:00:00.000Z",
  carrier: "Royal Mail",
  trackingReference: "AA123456789GB",
  dispatchedAt: "2026-11-27T11:00:00.000Z",
};

function row(kind: EmailOutboxRow["kind"], overrides: Partial<EmailOutboxRow> = {}): EmailOutboxRow {
  return {
    id: `outbox-${kind}`,
    kind,
    entityId: `entity-${kind}`,
    deduplicationKey: `${kind}:entity`,
    status: "processing",
    attemptCount: 1,
    nextAttemptAt: "2026-11-27T09:00:00.000Z",
    processingStartedAt: "2026-11-27T09:00:00.000Z",
    sentAt: null,
    lastError: "",
    createdAt: "2026-11-27T09:00:00.000Z",
    updatedAt: "2026-11-27T09:00:00.000Z",
    ...overrides,
  };
}

function repository(claimed: EmailOutboxRow[]): EmailOutboxRepository & {
  complete: ReturnType<typeof vi.fn>;
  fail: ReturnType<typeof vi.fn>;
} {
  return {
    claim: vi.fn().mockResolvedValue(claimed),
    loadOrder: vi.fn().mockResolvedValue(order),
    loadContact: vi.fn().mockResolvedValue({
      id: "contact-1",
      name: "Casey Rider",
      email: "casey@example.com",
      orderReference: "RT-10000001",
      message: "Can you help?",
      createdAt: "2026-11-27T10:00:00.000Z",
    }),
    complete: vi.fn().mockResolvedValue(true),
    fail: vi.fn().mockResolvedValue(true),
  };
}

describe("email outbox processor", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("claims, renders, sends, and completes an order confirmation", async () => {
    const repo = repository([row("order_confirmation")]);
    const sender = vi.fn().mockResolvedValue(undefined);
    const processor = createEmailOutboxProcessor(repo, sender);

    await expect(processor({ limit: 5 })).resolves.toEqual({ claimed: 1, sent: 1, retrying: 0, failed: 0 });
    expect(repo.claim).toHaveBeenCalledWith(5);
    expect(sender).toHaveBeenCalledWith(expect.objectContaining({
      to: "alex@example.com",
      subject: "Order confirmed — RT-10000001",
    }));
    expect(repo.complete).toHaveBeenCalledWith("outbox-order_confirmation");
  });

  it("loads canonical dispatch and Contact records", async () => {
    const repo = repository([row("dispatch_confirmation"), row("contact_alert")]);
    const sent: EmailMessage[] = [];
    const processor = createEmailOutboxProcessor(repo, async (message) => { sent.push(message); });

    await expect(processor()).resolves.toEqual({ claimed: 2, sent: 2, retrying: 0, failed: 0 });
    expect(sent[0]).toMatchObject({ to: "alex@example.com", subject: expect.stringContaining("dispatched") });
    expect(sent[1]).toMatchObject({ to: "info@regitech.co.uk", replyTo: "casey@example.com" });
  });

  it("schedules transient SMTP failures for retry using a safe error", async () => {
    const repo = repository([row("order_confirmation")]);
    const processor = createEmailOutboxProcessor(repo, vi.fn().mockRejectedValue({
      responseCode: 451,
      message: "private recipient and server detail",
    }));

    await expect(processor()).resolves.toEqual({ claimed: 1, sent: 0, retrying: 1, failed: 0 });
    expect(repo.fail).toHaveBeenCalledWith(
      "outbox-order_confirmation",
      "SMTP temporarily unavailable (451).",
      false,
    );
  });

  it("stops immediately for permanent SMTP rejection", async () => {
    const repo = repository([row("order_confirmation")]);
    const processor = createEmailOutboxProcessor(repo, vi.fn().mockRejectedValue({ responseCode: 550 }));

    await expect(processor()).resolves.toEqual({ claimed: 1, sent: 0, retrying: 0, failed: 1 });
    expect(repo.fail).toHaveBeenCalledWith(
      "outbox-order_confirmation",
      "Email was rejected by the receiving server (550).",
      true,
    );
  });

  it("makes attempt eight terminal even for a transient error", async () => {
    const repo = repository([row("order_confirmation", { attemptCount: 8 })]);
    const processor = createEmailOutboxProcessor(repo, vi.fn().mockRejectedValue({ code: "ETIMEDOUT" }));

    await expect(processor()).resolves.toEqual({ claimed: 1, sent: 0, retrying: 0, failed: 1 });
    expect(repo.fail).toHaveBeenCalledWith(
      "outbox-order_confirmation",
      "Email service connection failed.",
      true,
    );
  });

  it("fails a missing canonical entity without calling the sender", async () => {
    const repo = repository([row("contact_alert")]);
    repo.loadContact = vi.fn().mockResolvedValue(null);
    const sender = vi.fn();
    const processor = createEmailOutboxProcessor(repo, sender);

    await expect(processor()).resolves.toEqual({ claimed: 1, sent: 0, retrying: 0, failed: 1 });
    expect(sender).not.toHaveBeenCalled();
    expect(repo.fail).toHaveBeenCalledWith(
      "outbox-contact_alert",
      "Email source record is unavailable.",
      true,
    );
  });

  it("keeps the Message-ID stable after an acknowledgement loss", async () => {
    const claimedRow = row("order_confirmation");
    const repo = repository([claimedRow]);
    const messageIds: string[] = [];
    const sender = vi.fn(async (message: EmailMessage) => {
      messageIds.push(message.messageId);
      if (messageIds.length === 1) throw { code: "ECONNRESET" };
    });
    const processor = createEmailOutboxProcessor(repo, sender);

    await processor();
    repo.claim = vi.fn().mockResolvedValue([{ ...claimedRow, attemptCount: 2 }]);
    await processor();

    expect(messageIds).toHaveLength(2);
    expect(messageIds[0]).toBe(messageIds[1]);
  });

  it("logs identifiers and safe messages without raw provider detail", async () => {
    const repo = repository([row("order_confirmation")]);
    const logger = { info: vi.fn(), warn: vi.fn() };
    const processor = createEmailOutboxProcessor(
      repo,
      vi.fn().mockRejectedValue({ responseCode: 451, message: "secret smtp payload" }),
      logger,
    );

    await processor();
    const logged = JSON.stringify(logger.warn.mock.calls);
    expect(logged).toContain("outbox-order_confirmation");
    expect(logged).toContain("SMTP temporarily unavailable (451).");
    expect(logged).not.toContain("secret smtp payload");
    expect(logged).not.toContain("alex@example.com");
  });
});
