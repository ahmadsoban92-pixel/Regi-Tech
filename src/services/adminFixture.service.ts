import "server-only";
import type { PlateConfiguration } from "@/types/order";
import type { VerificationStatus } from "@/types/orderApi";
import type { AdminFulfilmentStatus, AdminOrder, AdminOrderFilters, AdminOrderRepository } from "@/types/admin";

const roadLegalPlate: PlateConfiguration = {
  productId: "2d-road-legal",
  productName: "2D Printed Road-Legal Number Plate",
  badge: "Road-legal",
  useType: "road-legal",
  registration: "CD24 EFG",
  size: "7×9″",
  customWidth: "",
  customHeight: "",
  customDimensionUnit: "in",
  innerBorder: "None",
  outerBorder: "None",
  logo: "No Logo",
  logoPosition: { x: 50, y: 12 },
  uploadedLogoName: "",
  uploadedLogoPreviewUrl: "",
  uploadedLogoMimeType: "",
  sloganMode: "none",
  sloganPlacement: "plate",
  sloganText: "",
  sloganFont: "Rebel",
  countryFlag: "uk",
  fixing: "adhesive-kit",
  specialRequirements: "",
  basePrice: 13.99
};

const showPlate: PlateConfiguration = {
  productId: "hand-crafted-show-plate",
  productName: "Hand Crafted SHOW PLATE",
  badge: "Show plate",
  useType: "show",
  registration: "AB76 BCD",
  size: "6×8″",
  customWidth: "",
  customHeight: "",
  customDimensionUnit: "in",
  innerBorder: "Mirror Silver",
  outerBorder: "None",
  logo: "No Logo",
  logoPosition: { x: 50, y: 12 },
  uploadedLogoName: "",
  uploadedLogoPreviewUrl: "",
  uploadedLogoMimeType: "",
  sloganMode: "none",
  sloganPlacement: "plate",
  sloganText: "",
  sloganFont: "Rebel",
  countryFlag: "none",
  fixing: "none",
  specialRequirements: "Please keep the registration vertically centred.",
  basePrice: 17.99
};

const orders: AdminOrder[] = [
  {
    id: "fixture-order-1002",
    reference: "RT-1002",
    createdAt: "2026-10-05T12:30:00.000Z",
    paymentStatus: "paid",
    verificationStatus: "pending",
    fulfilmentStatus: "new",
    customer: {
      firstName: "Amelia",
      lastName: "Clarke",
      email: "amelia.clarke@example.com",
      telephone: "+44 7700 900456",
      deliveryAddress: { addressLine1: "4 Willow Court", addressLine2: "Kings Road", town: "Bristol", county: "", postcode: "BS1 4QS", country: "United Kingdom" },
      billingAddress: { addressLine1: "4 Willow Court", addressLine2: "Kings Road", town: "Bristol", county: "", postcode: "BS1 4QS", country: "United Kingdom" }
    },
    items: [{
      id: "fixture-item-1002-1",
      position: 0,
      config: roadLegalPlate,
      quantity: 1,
      priceBreakdown: [
        { label: "2D Printed Road-Legal Number Plate — base price", amount: 13.99 },
        { label: "Country flag", amount: 2 },
        { label: "3M VHB Adhesive Tape", amount: 1 }
      ],
      unitTotalPence: 1699,
      lineTotalPence: 1699
    }],
    subtotalPence: 1699,
    deliveryPence: 0,
    totalPence: 1699,
    currency: "gbp",
    orderNotes: "",
    uploads: [],
    privateNotes: [],
    timeline: [{ id: "event-1002-1", title: "Order placed", actor: "system", createdAt: "2026-10-05T12:30:00.000Z" }],
    carrier: "",
    trackingReference: ""
  },
  {
    id: "fixture-order-1001",
    reference: "RT-1001",
    createdAt: "2026-10-04T09:15:00.000Z",
    paymentStatus: "paid",
    verificationStatus: "not_required",
    fulfilmentStatus: "new",
    customer: {
      firstName: "Oliver",
      lastName: "Bennett",
      email: "oliver.bennett@example.com",
      telephone: "+44 7700 900321",
      deliveryAddress: { addressLine1: "18 Market Street", addressLine2: "", town: "Reading", county: "Berkshire", postcode: "RG1 2AA", country: "United Kingdom" },
      billingAddress: { addressLine1: "18 Market Street", addressLine2: "", town: "Reading", county: "Berkshire", postcode: "RG1 2AA", country: "United Kingdom" }
    },
    items: [{
      id: "fixture-item-1001-1",
      position: 0,
      config: showPlate,
      quantity: 1,
      priceBreakdown: [
        { label: "Hand Crafted SHOW PLATE — base price", amount: 17.99 },
        { label: "Mirror Silver inner border", amount: 5 }
      ],
      unitTotalPence: 2299,
      lineTotalPence: 2299
    }],
    subtotalPence: 2299,
    deliveryPence: 0,
    totalPence: 2299,
    currency: "gbp",
    orderNotes: "Leave in the porch if nobody is home.",
    uploads: [],
    privateNotes: [],
    timeline: [{ id: "event-1001-1", title: "Order placed", actor: "system", createdAt: "2026-10-04T09:15:00.000Z" }],
    carrier: "",
    trackingReference: ""
  }
];

function cloneOrder(order: AdminOrder): AdminOrder {
  return structuredClone(order);
}

function matchesDate(date: string, from: string, to: string) {
  const day = date.slice(0, 10);
  return (!from || day >= from) && (!to || day <= to);
}

function matchesQuery(order: AdminOrder, query: string) {
  if (!query.trim()) return true;
  const needle = query.trim().toLocaleLowerCase("en-GB");
  const haystack = [
    order.reference,
    order.customer.firstName,
    order.customer.lastName,
    order.customer.email,
    ...order.items.flatMap((item) => [item.config.registration, item.config.productName])
  ].join(" ").toLocaleLowerCase("en-GB");
  return haystack.includes(needle);
}

function findFixture(reference: string) {
  const order = orders.find((item) => item.reference.toLocaleLowerCase("en-GB") === reference.toLocaleLowerCase("en-GB"));
  if (!order) throw new Error("Fixture order not found.");
  return order;
}

export const adminFixtureRepository: AdminOrderRepository = {
  async getDashboard() {
    const latestOrders = [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5).map(cloneOrder);
    return {
      metrics: {
        totalOrders: orders.length,
        awaitingFulfilment: orders.filter((order) => order.fulfilmentStatus === "new" || order.fulfilmentStatus === "in_production").length,
        awaitingVerification: orders.filter((order) => order.verificationStatus === "pending").length,
        paidOrderValuePence: orders.filter((order) => order.paymentStatus === "paid").reduce((total, order) => total + order.totalPence, 0)
      },
      latestOrders
    };
  },
  async listOrders(filters: AdminOrderFilters) {
    const filtered = orders
      .filter((order) => matchesQuery(order, filters.query))
      .filter((order) => matchesDate(order.createdAt, filters.from, filters.to))
      .filter((order) => filters.payment === "all" || order.paymentStatus === filters.payment)
      .filter((order) => filters.fulfilment === "all" || order.fulfilmentStatus === filters.fulfilment)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(cloneOrder);
    return { orders: filtered, total: filtered.length, page: 1, pageSize: 25, totalPages: 1 };
  },
  async getOrder(reference: string) {
    const order = orders.find((item) => item.reference.toLocaleLowerCase("en-GB") === reference.toLocaleLowerCase("en-GB"));
    return order ? cloneOrder(order) : null;
  },
  async updateFulfilment(reference: string, status: AdminFulfilmentStatus) {
    return { ...cloneOrder(findFixture(reference)), fulfilmentStatus: status };
  },
  async updateVerification(reference: string, status: VerificationStatus) {
    return { ...cloneOrder(findFixture(reference)), verificationStatus: status };
  },
  async saveCarrier(reference: string, carrier: string, trackingReference: string) {
    return { ...cloneOrder(findFixture(reference)), carrier, trackingReference };
  },
  async addNote(reference: string, body: string) {
    const order = cloneOrder(findFixture(reference));
    order.privateNotes.push({ id: `preview-${order.privateNotes.length + 1}`, author: "Owner Admin", body, createdAt: new Date().toISOString() });
    return order;
  },
  async cancelOrder(reference: string) {
    return { ...cloneOrder(findFixture(reference)), fulfilmentStatus: "cancelled" };
  }
};
