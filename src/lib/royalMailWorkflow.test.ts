import { describe, expect, it, vi } from "vitest";
import { createRoyalMailWorkflow } from "./royalMailWorkflow";

const order = {
  id: "order-id", reference: "RT-123", createdAt: "2026-11-20T10:00:00.000Z",
  paymentStatus: "paid", verificationStatus: "not_required", fulfilmentStatus: "in_production",
  customer: { firstName: "Alex", lastName: "Rider", email: "alex@example.com", telephone: "07123456789",
    deliveryAddress: { addressLine1: "1 High Street", addressLine2: "", town: "Leeds", county: "", postcode: "LS1 1AA", country: "United Kingdom" } },
  subtotalPence: 2000, deliveryPence: 0, totalPence: 2000,
};
const parcel = { weightGrams: 220, lengthMm: 290, widthMm: 210, depthMm: 18 };
const actor = { userId: "admin-id", displayName: "Owner" };
const reserved = { orderId: "order-id", reservationToken: "token", status: "reserved" as const,
  serviceCode: "TRS48", weightGrams: 220, lengthMm: 290, widthMm: 210, depthMm: 18,
  externalOrderId: null, trackingNumber: "" };

describe("Royal Mail booking workflow", () => {
  it("does not send a second booking request for an existing reservation", async () => {
    const api = { createOrder: vi.fn(), findOrder: vi.fn(), markDespatched: vi.fn() };
    const repository = { reserve: vi.fn(async () => ({ created: false, shipment: reserved })), confirm: vi.fn(), finishDispatch: vi.fn() };
    const workflow = createRoyalMailWorkflow(repository, api);
    await expect(workflow.book(order, parcel, actor)).rejects.toThrow(/already started/i);
    expect(api.createOrder).not.toHaveBeenCalled();
  });

  it("leaves an uncertain request reserved and permits reference-based recovery", async () => {
    const api = { createOrder: vi.fn(async () => { throw new Error("timeout"); }),
      findOrder: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ orderIdentifier: 42, trackingNumber: "AA123456789GB" }), markDespatched: vi.fn() };
    const repository = { reserve: vi.fn(async () => ({ created: true, shipment: reserved })),
      confirm: vi.fn(async () => true), finishDispatch: vi.fn() };
    const workflow = createRoyalMailWorkflow(repository, api);
    await expect(workflow.book(order, parcel, actor)).rejects.toThrow(/check click & drop/i);
    await workflow.recover(order, reserved, actor);
    expect(api.createOrder).toHaveBeenCalledTimes(1);
    expect(api.findOrder).toHaveBeenCalledWith("RT-123");
    expect(repository.confirm).toHaveBeenCalledWith("order-id", "token", 42, "AA123456789GB", actor);
  });

  it("adopts an existing Click & Drop order without posting another one", async () => {
    const api = { createOrder: vi.fn(), findOrder: vi.fn(async () => ({ orderIdentifier: 42, trackingNumber: "AA123456789GB" })), markDespatched: vi.fn() };
    const repository = { reserve: vi.fn(async () => ({ created: true, shipment: reserved })), confirm: vi.fn(async () => true), finishDispatch: vi.fn() };
    await createRoyalMailWorkflow(repository, api).book(order, parcel, actor);
    expect(api.createOrder).not.toHaveBeenCalled();
    expect(repository.confirm).toHaveBeenCalled();
  });

  it("records dispatch only after Royal Mail confirms it", async () => {
    const api = { createOrder: vi.fn(), findOrder: vi.fn(), markDespatched: vi.fn(async () => { throw new Error("Royal Mail unavailable"); }) };
    const repository = { reserve: vi.fn(), confirm: vi.fn(), finishDispatch: vi.fn(async () => true) };
    const shipment = { ...reserved, status: "booked" as const, externalOrderId: 42, trackingNumber: "AA123456789GB" };
    await expect(createRoyalMailWorkflow(repository, api).dispatch(order, shipment, actor)).rejects.toThrow("Royal Mail unavailable");
    expect(repository.finishDispatch).not.toHaveBeenCalled();
    api.markDespatched.mockResolvedValueOnce(undefined as never);
    await createRoyalMailWorkflow(repository, api).dispatch(order, shipment, actor);
    expect(repository.finishDispatch).toHaveBeenCalledWith("order-id", actor);
  });
});
