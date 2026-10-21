import type { CartItem, CustomerDetails, PlateConfiguration, PriceLine } from "@/types/order";

export type PaymentStatus = "pending_payment" | "paid" | "payment_failed" | "expired";
export type VerificationStatus = "not_required" | "pending" | "approved" | "rejected";

export type CheckoutSubmission = {
  items: Array<CartItem & { v5cUploadId?: string; artworkUploadId?: string }>;
  customer: CustomerDetails;
  orderNotes: string;
};

export type CheckoutSessionData = {
  reference: string;
  checkoutUrl: string;
};

export type OrderConfirmationData = {
  reference: string;
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  items: Array<{
    id: string;
    position: number;
    config: PlateConfiguration;
    quantity: number;
    priceBreakdown: PriceLine[];
    unitTotalPence: number;
    lineTotalPence: number;
  }>;
  orderNotes: string;
  subtotalPence: number;
  deliveryPence: number;
  totalPence: number;
  currency: "gbp";
  createdAt: string;
};
