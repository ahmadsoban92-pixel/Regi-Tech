export type ParcelMeasurements = { weightGrams: number; lengthMm: number; widthMm: number; depthMm: number };

export type RoyalMailService = { code: "TRS48" | "TPS48"; label: string; packageFormat: "largeLetter" | "smallParcel" | "mediumParcel" };

export type RoyalMailOrderSource = {
  reference: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    deliveryAddress: { addressLine1: string; addressLine2: string; town: string; county: string; postcode: string; country: string };
  };
  subtotalPence: number;
  deliveryPence: number;
  totalPence: number;
};

export function assertRoyalMailBookingAllowed(order: { paymentStatus: string; verificationStatus: string; fulfilmentStatus: string }) {
  if (order.paymentStatus !== "paid" ||
      !["approved", "not_required"].includes(order.verificationStatus) ||
      order.fulfilmentStatus !== "in_production") {
    throw new Error("The order must be paid, verified and in production before booking Royal Mail.");
  }
}

function isPositiveInteger(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

export function selectRoyalMailService(parcel: ParcelMeasurements): RoyalMailService {
  if (!isPositiveInteger(parcel.weightGrams) || parcel.weightGrams > 20000 ||
      !isPositiveInteger(parcel.lengthMm) || !isPositiveInteger(parcel.widthMm) || !isPositiveInteger(parcel.depthMm)) {
    throw new Error("Enter a valid packed weight and all three parcel dimensions.");
  }
  const [shortest, middle, longest] = [parcel.lengthMm, parcel.widthMm, parcel.depthMm].sort((a, b) => a - b);
  if (parcel.weightGrams <= 750 && shortest < 20 && middle < 220 && longest < 300) {
    return { code: "TRS48", label: "Tracked 48 LBT", packageFormat: "largeLetter" };
  }
  if (parcel.weightGrams <= 2000 && longest <= 450 && middle <= 350 && shortest <= 160) {
    return { code: "TPS48", label: "Tracked 48", packageFormat: "smallParcel" };
  }
  if (longest <= 610 && middle <= 460 && shortest <= 460) {
    return { code: "TPS48", label: "Tracked 48", packageFormat: "mediumParcel" };
  }
  throw new Error("The packed parcel exceeds the supported Tracked 48 dimensions. Arrange shipping manually.");
}

function pounds(pence: number) {
  if (!Number.isSafeInteger(pence) || pence < 0) throw new Error("Order amount is invalid.");
  return Number((pence / 100).toFixed(2));
}

export function buildRoyalMailOrder(order: RoyalMailOrderSource, parcel: ParcelMeasurements) {
  const service = selectRoyalMailService(parcel);
  const [depthMm, heightMm, widthMm] = [parcel.lengthMm, parcel.widthMm, parcel.depthMm].sort((a, b) => a - b);
  const address = order.customer.deliveryAddress;
  if (!/^(united kingdom|uk|gb|great britain)$/i.test(address.country.trim())) {
    throw new Error("Royal Mail booking currently supports UK delivery addresses only.");
  }
  if (!order.reference || order.reference.length > 40 || !address.addressLine1.trim() || !address.town.trim() || !address.postcode.trim()) {
    throw new Error("The order is missing a valid reference or delivery address.");
  }
  if ([address.addressLine1, address.addressLine2, address.town, address.county].some((part) => part.trim().length > 100) ||
      address.postcode.trim().length > 20) {
    throw new Error("The delivery address exceeds Royal Mail's address limits. Correct it before booking.");
  }
  return {
    items: [{
      orderReference: order.reference,
      isRecipientABusiness: false,
      recipient: {
        address: {
          fullName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
          addressLine1: address.addressLine1.trim(),
          ...(address.addressLine2.trim() ? { addressLine2: address.addressLine2.trim() } : {}),
          city: address.town.trim(),
          ...(address.county.trim() ? { county: address.county.trim() } : {}),
          postcode: address.postcode.trim(),
          countryCode: "GBR",
        },
        ...(order.customer.email.trim() ? { emailAddress: order.customer.email.trim() } : {}),
        ...(order.customer.telephone.trim().length <= 25 && order.customer.telephone.trim() ? { phoneNumber: order.customer.telephone.trim() } : {}),
      },
      packages: [{
        weightInGrams: parcel.weightGrams,
        packageFormatIdentifier: service.packageFormat,
        dimensions: { heightInMms: heightMm, widthInMms: widthMm, depthInMms: depthMm },
      }],
      orderDate: order.createdAt,
      subtotal: pounds(order.subtotalPence),
      shippingCostCharged: pounds(order.deliveryPence),
      total: pounds(order.totalPence),
      currencyCode: "GBP",
      postageDetails: { serviceCode: service.code, serviceRegisterCode: "01" },
      label: { includeLabelInResponse: false },
    }],
  };
}

export function parseRoyalMailCreatedOrder(response: unknown, reference: string): { orderIdentifier: number; trackingNumber: string } {
  if (!response || typeof response !== "object") throw new Error("Royal Mail returned an invalid booking response.");
  const result = response as { successCount?: unknown; errorsCount?: unknown; createdOrders?: unknown };
  if (result.successCount !== 1 || result.errorsCount !== 0 || !Array.isArray(result.createdOrders)) {
    throw new Error("Royal Mail did not accept the order.");
  }
  const created = result.createdOrders.find((item) => item && typeof item === "object" && item.orderReference === reference);
  if (!created || !Number.isSafeInteger(created.orderIdentifier) || created.orderIdentifier <= 0) {
    throw new Error("Royal Mail did not return a matching order identifier.");
  }
  const tracking = typeof created.trackingNumber === "string" ? created.trackingNumber :
    Array.isArray(created.packages) && typeof created.packages[0]?.trackingNumber === "string" ? created.packages[0].trackingNumber : "";
  return { orderIdentifier: created.orderIdentifier, trackingNumber: tracking };
}
