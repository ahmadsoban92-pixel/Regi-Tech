import { describe, expect, it } from "vitest";
import { buildRoyalMailOrder, selectRoyalMailService, parseRoyalMailCreatedOrder, assertRoyalMailBookingAllowed } from "./royalMail";

describe("Royal Mail service selection", () => {
  it("chooses Tracked 48 LBT only for a measured large letter of up to 750 g", () => {
    expect(selectRoyalMailService({ weightGrams: 750, lengthMm: 299, widthMm: 219, depthMm: 19 })).toEqual({
      code: "TRS48", label: "Tracked 48 LBT", packageFormat: "largeLetter",
    });
    expect(selectRoyalMailService({ weightGrams: 751, lengthMm: 299, widthMm: 219, depthMm: 19 }).code).toBe("TPS48");
    expect(selectRoyalMailService({ weightGrams: 750, lengthMm: 300, widthMm: 219, depthMm: 19 }).code).toBe("TPS48");
    expect(selectRoyalMailService({ weightGrams: 750, lengthMm: 219, widthMm: 299, depthMm: 19 }).code).toBe("TRS48");
    expect(selectRoyalMailService({ weightGrams: 2400, lengthMm: 400, widthMm: 300, depthMm: 70 }).packageFormat).toBe("mediumParcel");
  });

  it("rejects unmeasured or impossible parcels", () => {
    expect(() => selectRoyalMailService({ weightGrams: 0, lengthMm: 299, widthMm: 219, depthMm: 19 })).toThrow();
    expect(() => selectRoyalMailService({ weightGrams: 30001, lengthMm: 299, widthMm: 219, depthMm: 19 })).toThrow();
    expect(() => selectRoyalMailService({ weightGrams: 200, lengthMm: 299, widthMm: 0, depthMm: 19 })).toThrow();
    expect(() => selectRoyalMailService({ weightGrams: 21000, lengthMm: 500, widthMm: 300, depthMm: 100 })).toThrow();
  });
});

describe("Royal Mail order mapping", () => {
  const order = {
    reference: "RT-12345",
    createdAt: "2026-11-20T10:00:00.000Z",
    customer: {
      firstName: "Alex", lastName: "Rider", email: "alex@example.com", telephone: "07123456789",
      deliveryAddress: { addressLine1: "12 High Street", addressLine2: "Flat 2", town: "Leeds", county: "West Yorkshire", postcode: "LS1 1AA", country: "United Kingdom" },
    },
    subtotalPence: 2799, deliveryPence: 0, totalPence: 2799,
  };

  it("maps a paid domestic order to the official API shape without exposing billing data", () => {
    const payload = buildRoyalMailOrder(order, { weightGrams: 220, lengthMm: 290, widthMm: 210, depthMm: 18 });
    expect(payload).toMatchObject({
      items: [{
        orderReference: "RT-12345", orderDate: order.createdAt, subtotal: 27.99, shippingCostCharged: 0, total: 27.99,
        recipient: { emailAddress: "alex@example.com", address: { fullName: "Alex Rider", addressLine1: "12 High Street", city: "Leeds", postcode: "LS1 1AA", countryCode: "GBR" } },
        packages: [{ weightInGrams: 220, packageFormatIdentifier: "largeLetter", dimensions: { heightInMms: 210, widthInMms: 290, depthInMms: 18 } }],
        postageDetails: { serviceCode: "TRS48", serviceRegisterCode: "01" },
      }],
    });
    expect(JSON.stringify(payload)).not.toContain("billing");
  });

  it("rejects a non-UK delivery address", () => {
    expect(() => buildRoyalMailOrder({ ...order, customer: { ...order.customer, deliveryAddress: { ...order.customer.deliveryAddress, country: "France" } } }, { weightGrams: 220, lengthMm: 290, widthMm: 210, depthMm: 18 })).toThrow();
  });

  it("checks the carrier's shorter address limit before reserving a booking", () => {
    expect(() => buildRoyalMailOrder({ ...order, customer: { ...order.customer, deliveryAddress: { ...order.customer.deliveryAddress, addressLine1: "a".repeat(101) } } }, { weightGrams: 220, lengthMm: 290, widthMm: 210, depthMm: 18 })).toThrow(/address/i);
  });

  it("sends rotated packed dimensions in their physical long, middle and short orientation", () => {
    const payload = buildRoyalMailOrder(order, { weightGrams: 220, lengthMm: 18, widthMm: 290, depthMm: 210 });
    expect(payload.items[0].packages[0].dimensions).toEqual({ heightInMms: 210, widthInMms: 290, depthInMms: 18 });
  });
});

describe("Royal Mail response mapping", () => {
  it("accepts only the matching created order with a valid identifier", () => {
    expect(parseRoyalMailCreatedOrder({ successCount: 1, errorsCount: 0, createdOrders: [{ orderReference: "RT-12345", orderIdentifier: 123, trackingNumber: "AA123456789GB" }] }, "RT-12345"))
      .toEqual({ orderIdentifier: 123, trackingNumber: "AA123456789GB" });
    expect(() => parseRoyalMailCreatedOrder({ successCount: 0, errorsCount: 1, createdOrders: [] }, "RT-12345")).toThrow();
    expect(() => parseRoyalMailCreatedOrder({ successCount: 1, errorsCount: 0, createdOrders: [{ orderReference: "OTHER", orderIdentifier: 123 }] }, "RT-12345")).toThrow();
  });
});

describe("Royal Mail booking eligibility", () => {
  const ready = { paymentStatus: "paid", verificationStatus: "approved", fulfilmentStatus: "in_production" };
  it("requires payment, completed verification, and production status", () => {
    expect(() => assertRoyalMailBookingAllowed(ready)).not.toThrow();
    expect(() => assertRoyalMailBookingAllowed({ ...ready, verificationStatus: "not_required" })).not.toThrow();
    for (const changed of [
      { paymentStatus: "pending_payment" }, { verificationStatus: "pending" },
      { verificationStatus: "rejected" }, { fulfilmentStatus: "new" },
      { fulfilmentStatus: "dispatched" }, { fulfilmentStatus: "cancelled" },
    ]) expect(() => assertRoyalMailBookingAllowed({ ...ready, ...changed })).toThrow();
  });
});
