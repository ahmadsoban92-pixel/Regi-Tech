import { beforeEach, describe, expect, it, vi } from "vitest";

const { processEmailOutbox } = vi.hoisted(() => ({ processEmailOutbox: vi.fn() }));

vi.mock("@/services/emailOutbox.service", () => ({ processEmailOutbox }));
vi.mock("@/lib/env", () => ({
  getEmailServerEnv: () => ({ workerSecret: "worker-secret-with-at-least-32-characters" }),
  ServerConfigurationError: class ServerConfigurationError extends Error {},
}));

import { dynamic, POST, runtime, verifyWorkerAuthorization } from "./route";

describe("internal email outbox route", () => {
  beforeEach(() => {
    processEmailOutbox.mockReset().mockResolvedValue({ claimed: 2, sent: 1, retrying: 1, failed: 0 });
  });

  it("rejects missing and incorrect bearer tokens", async () => {
    const missing = await POST(new Request("https://regitech.co.uk/api/v1/internal/email-outbox", { method: "POST" }));
    const wrong = await POST(new Request("https://regitech.co.uk/api/v1/internal/email-outbox", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret-with-at-least-32-chars" },
    }));

    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(processEmailOutbox).not.toHaveBeenCalled();
  });

  it("processes a bounded batch with the correct secret", async () => {
    const response = await POST(new Request("https://regitech.co.uk/api/v1/internal/email-outbox", {
      method: "POST",
      headers: { authorization: "Bearer worker-secret-with-at-least-32-characters" },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      success: true,
      data: { claimed: 2, sent: 1, retrying: 1, failed: 0 },
      message: "Email outbox processed.",
    });
    expect(processEmailOutbox).toHaveBeenCalledWith({ limit: 10 });
  });

  it("compares equal-length tokens and rejects unequal lengths", () => {
    expect(verifyWorkerAuthorization("Bearer abcdef", "abcdef")).toBe(true);
    expect(verifyWorkerAuthorization("Bearer abcdeg", "abcdef")).toBe(false);
    expect(verifyWorkerAuthorization("Bearer short", "much-longer-secret")).toBe(false);
    expect(verifyWorkerAuthorization("Basic abcdef", "abcdef")).toBe(false);
  });

  it("uses the Node runtime and disables static caching", () => {
    expect(runtime).toBe("nodejs");
    expect(dynamic).toBe("force-dynamic");
  });
});
