import type { AddressDetails, PlateConfiguration, PriceLine } from "@/types/order";
import type { PaymentStatus, VerificationStatus } from "@/types/orderApi";

export type AdminFulfilmentStatus = "new" | "in_production" | "dispatched" | "cancelled";

export type AdminOrderItem = {
  id: string;
  position: number;
  config: PlateConfiguration;
  quantity: number;
  priceBreakdown: PriceLine[];
  unitTotalPence: number;
  lineTotalPence: number;
};

export type AdminCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  deliveryAddress: AddressDetails;
  billingAddress: AddressDetails;
};

export type AdminOrderUpload = {
  id: string;
  itemId: string;
  kind: "v5c" | "artwork";
  name: string;
  mimeType: string;
  sizeLabel: string;
};

export type AdminOrderNote = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type AdminTimelineEvent = {
  id: string;
  title: string;
  actor: string;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  reference: string;
  createdAt: string;
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  fulfilmentStatus: AdminFulfilmentStatus;
  customer: AdminCustomer;
  items: AdminOrderItem[];
  subtotalPence: number;
  deliveryPence: number;
  totalPence: number;
  currency: "gbp";
  orderNotes: string;
  uploads: AdminOrderUpload[];
  privateNotes: AdminOrderNote[];
  timeline: AdminTimelineEvent[];
  carrier: string;
  trackingReference: string;
};

export type AdminOrderFilters = {
  query: string;
  from: string;
  to: string;
  payment: PaymentStatus | "all";
  fulfilment: AdminFulfilmentStatus | "all";
  page: number;
};

export type AdminOrderList = { orders: AdminOrder[]; total: number; page: number; pageSize: number; totalPages: number };

export type AdminActor = { userId: string; displayName: string };
export type AdminFulfilmentDetails = { carrier?: string; trackingReference?: string; cancellationReason?: string };

export type AdminDashboardMetrics = {
  totalOrders: number;
  awaitingFulfilment: number;
  awaitingVerification: number;
  paidOrderValuePence: number;
};

export type AdminOrderRepository = {
  getDashboard(): Promise<{ metrics: AdminDashboardMetrics; latestOrders: AdminOrder[] }>;
  listOrders(filters: AdminOrderFilters): Promise<AdminOrderList>;
  getOrder(reference: string): Promise<AdminOrder | null>;
  updateFulfilment(reference: string, status: AdminFulfilmentStatus, actor: AdminActor, details?: AdminFulfilmentDetails): Promise<AdminOrder>;
  updateVerification(reference: string, status: VerificationStatus, actor: AdminActor): Promise<AdminOrder>;
  saveCarrier(reference: string, carrier: string, trackingReference: string, actor: AdminActor): Promise<AdminOrder>;
  addNote(reference: string, body: string, actor: AdminActor): Promise<AdminOrder>;
  cancelOrder(reference: string, reason: string, actor: AdminActor): Promise<AdminOrder>;
};
