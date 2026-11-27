import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createAdminEmailsService,
  type AdminEmailRepository,
  type AdminEmailRow,
} from "@/services/adminEmails.service";

const rows: AdminEmailRow[] = [
  {
    id: "email-2",
    kind: "dispatch_confirmation",
    entityId: "order-2",
    status: "retry",
    attemptCount: 2,
    nextAttemptAt: "2026-11-27T12:00:00.000Z",
    lastError: "SMTP temporarily unavailable (451).",
    createdAt: "2026-11-27T11:00:00.000Z",
    updatedAt: "2026-11-27T11:05:00.000Z",
    sentAt: null,
    reference: "RT-10000002",
  },
  {
    id: "email-1",
    kind: "order_confirmation",
    entityId: "order-1",
    status: "sent",
    attemptCount: 1,
    nextAttemptAt: "2026-11-27T10:00:00.000Z",
    lastError: "",
    createdAt: "2026-11-27T10:00:00.000Z",
    updatedAt: "2026-11-27T10:01:00.000Z",
    sentAt: "2026-11-27T10:01:00.000Z",
    reference: "RT-10000001",
  },
];

function repository(): AdminEmailRepository & { retry: ReturnType<typeof vi.fn> } {
  return {
    list: vi.fn().mockResolvedValue({ rows, total: 2 }),
    getStatus: vi.fn().mockResolvedValue("retry"),
    retry: vi.fn().mockResolvedValue(true),
  };
}

describe("Admin email delivery service", () => {
  it("lists newest-first deliveries with bounded pagination and filters", async () => {
    const repo = repository();
    const service = createAdminEmailsService(repo);

    const result = await service.list({ status: "retry", kind: "dispatch_confirmation", page: 2 });

    expect(repo.list).toHaveBeenCalledWith({
      status: "retry",
      kind: "dispatch_confirmation",
      offset: 25,
      limit: 25,
    });
    expect(result).toMatchObject({ total: 2, page: 1, pageSize: 25, totalPages: 1 });
    expect(result.deliveries.map((delivery) => delivery.id)).toEqual(["email-2", "email-1"]);
    expect(result.deliveries[0]).not.toHaveProperty("message");
    expect(result.deliveries[0]).not.toHaveProperty("recipient");
  });

  it("resets retry and failed rows through the repository", async () => {
    const repo = repository();
    const service = createAdminEmailsService(repo);

    await expect(service.retry("email-2")).resolves.toBeUndefined();
    expect(repo.retry).toHaveBeenCalledWith("email-2");
  });

  it.each(["sent", "processing", "pending"] as const)("rejects %s rows", async (status) => {
    const repo = repository();
    repo.getStatus = vi.fn().mockResolvedValue(status);
    const service = createAdminEmailsService(repo);

    await expect(service.retry("email-1")).rejects.toThrow("This email cannot be retried in its current state.");
    expect(repo.retry).not.toHaveBeenCalled();
  });

  it("reports a failed retry reset", async () => {
    const repo = repository();
    repo.retry.mockResolvedValue(false);
    const service = createAdminEmailsService(repo);

    await expect(service.retry("email-2")).rejects.toThrow("Unable to retry this email.");
  });
});
