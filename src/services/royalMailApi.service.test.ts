import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createRoyalMailApi } from "./royalMailApi.service";

describe("Click & Drop API client", () => {
  it("uses the private key only in the authorisation header and validates a created order", async () => {
    const fetcher = vi.fn(async () => Response.json({ successCount: 1, errorsCount: 0, createdOrders: [{ orderReference: "RT-123", orderIdentifier: 14, trackingNumber: "AA123456789GB" }] }));
    const client = createRoyalMailApi("secret-test-key", fetcher);
    const created = await client.createOrder("RT-123", { items: [{ orderReference: "RT-123" }] });
    expect(created).toEqual({ orderIdentifier: 14, trackingNumber: "AA123456789GB" });
    const [url, request] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.parcel.royalmail.com/api/v1/orders");
    expect(request.headers).toMatchObject({ Authorization: "secret-test-key" });
    expect(request.redirect).toBe("error");
    expect(request.body).not.toContain("secret-test-key");
  });

  it("can recover a prior booking by its exact order reference", async () => {
    const fetcher = vi.fn(async () => Response.json([{ orderReference: "RT-123", orderIdentifier: 14, trackingNumber: "AA123456789GB" }]));
    const result = await createRoyalMailApi("secret-test-key", fetcher).findOrder("RT-123");
    expect(result).toEqual({ orderIdentifier: 14, trackingNumber: "AA123456789GB" });
    expect(String((fetcher as unknown as { mock: { calls: Array<[string]> } }).mock.calls[0][0])).toContain("/orders/%22RT-123%22");
  });

  it("rejects a label response that is not a PDF", async () => {
    const fetcher = vi.fn(async () => new Response("not a label", { status: 200, headers: { "content-type": "application/pdf" } }));
    await expect(createRoyalMailApi("secret-test-key", fetcher).getLabel(14)).rejects.toThrow(/PDF/);
  });

  it("treats a failed dispatch response as an error", async () => {
    const fetcher = vi.fn(async () => Response.json({ updatedOrders: [], errors: [{ message: "failed" }] }));
    await expect(createRoyalMailApi("secret-test-key", fetcher).markDespatched(14)).rejects.toThrow();
  });
});
