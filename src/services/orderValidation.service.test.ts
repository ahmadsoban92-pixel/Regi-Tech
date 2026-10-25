import { describe, expect, it } from "vitest";
import type { CheckoutSubmissionValues } from "@/lib/orderSchemas";
import { createDefaultConfiguration } from "@/lib/productCatalog";
import { canonicalizeCheckoutSubmission } from "@/services/orderValidation.service";

const customer = {
  firstName: "Test",
  lastName: "Customer",
  email: "test@example.com",
  telephone: "07123456789",
  deliveryAddress: { addressLine1: "1 Test Road", addressLine2: "", town: "Reading", county: "", postcode: "RG1 6LB", country: "United Kingdom" },
  billingSameAsDelivery: true,
  billingAddress: { addressLine1: "", addressLine2: "", town: "", county: "", postcode: "", country: "United Kingdom" },
  additionalNotes: "",
};

describe("checkout order validation", () => {
  it("allows a road-legal order without a V5C upload", () => {
    const submission: CheckoutSubmissionValues = {
      items: [{ id: "road-line", config: createDefaultConfiguration("2d-road-legal", "AB12CDE"), quantity: 1 }],
      customer,
      orderNotes: "",
    };
    const result = canonicalizeCheckoutSubmission(submission, { "road-line": { artwork: null, v5c: null } });
    expect(result.items[0].files.v5c).toBeNull();
  });

  it("continues to require artwork when Other Logo is selected", () => {
    const submission: CheckoutSubmissionValues = {
      items: [{ id: "art-line", config: { ...createDefaultConfiguration("hand-crafted-show-plate", "AB12 CDE"), logo: "Other Logo" }, quantity: 1 }],
      customer,
      orderNotes: "",
    };
    expect(() => canonicalizeCheckoutSubmission(submission, { "art-line": { artwork: null, v5c: null } })).toThrow("Upload the Other Logo artwork");
  });

  it("rejects prohibited 2D border combinations", () => {
    const submission: CheckoutSubmissionValues = {
      items: [{ id: "tampered-line", config: { ...createDefaultConfiguration("2d-show-plate", "AB12 CDE"), outerBorder: "Mirror Silver" }, quantity: 1 }],
      customer,
      orderNotes: "",
    };
    expect(() => canonicalizeCheckoutSubmission(submission, { "tampered-line": { artwork: null, v5c: null } })).toThrow("outer border is not available");
  });
});
