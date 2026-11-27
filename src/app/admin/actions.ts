"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { scheduleEmailOutboxProcessing } from "@/lib/emailScheduling";
import { adminRepository } from "@/services/admin.service";
import { requireAdmin } from "@/services/adminAuth.service";
import { bookRoyalMailShipment, dispatchRoyalMailShipment, getRoyalMailShipment, recoverRoyalMailShipment } from "@/services/royalMailShipment.service";

export type AdminActionState = { success: boolean; message: string };
export const initialAdminActionState: AdminActionState = { success: false, message: "" };

const referenceSchema = z.string().trim().min(1).max(32);
const controlsSchema = z.object({
  reference: referenceSchema,
  fulfilment: z.enum(["new", "in_production", "dispatched", "cancelled"]),
  verification: z.enum(["not_required", "pending", "approved", "rejected"]),
  carrier: z.string().trim().max(100),
  tracking: z.string().trim().max(120),
});
const parcelSchema = z.object({
  reference: referenceSchema,
  weightGrams: z.coerce.number().int().min(1).max(20000),
  lengthMm: z.coerce.number().int().min(1),
  widthMm: z.coerce.number().int().min(1),
  depthMm: z.coerce.number().int().min(1),
});

function refreshOrder(reference: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${reference}`);
}

export async function saveOrderControls(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = controlsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the order controls and try again." };
  const admin = await requireAdmin();
  const actor = { userId: admin.userId, displayName: admin.displayName };
  try {
    const current = await adminRepository.getOrder(parsed.data.reference);
    if (!current) return { success: false, message: "Order not found." };
    const shipment = await getRoyalMailShipment(current.id);
    if (shipment) {
      return { success: false, message: "This order has a Royal Mail booking. Use the shipment controls or reconcile it first." };
    }
    if (current.verificationStatus !== parsed.data.verification) {
      await adminRepository.updateVerification(parsed.data.reference, parsed.data.verification, actor);
    }
    await adminRepository.saveCarrier(parsed.data.reference, parsed.data.carrier, parsed.data.tracking, actor);
    if (current.fulfilmentStatus !== parsed.data.fulfilment) {
      await adminRepository.updateFulfilment(parsed.data.reference, parsed.data.fulfilment, actor, {
        carrier: parsed.data.carrier,
        trackingReference: parsed.data.tracking,
      });
      if (parsed.data.fulfilment === "dispatched") scheduleEmailOutboxProcessing();
    }
    refreshOrder(parsed.data.reference);
    return { success: true, message: "Order controls saved." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to save the order." };
  }
}

export async function addOrderNote(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = z.object({ reference: referenceSchema, note: z.string().trim().min(1).max(1000) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Enter a note of 1,000 characters or fewer." };
  const admin = await requireAdmin();
  try {
    await adminRepository.addNote(parsed.data.reference, parsed.data.note, { userId: admin.userId, displayName: admin.displayName });
    refreshOrder(parsed.data.reference);
    return { success: true, message: "Private note added." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to add the note." };
  }
}

export async function cancelAdminOrder(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = z.object({ reference: referenceSchema, reason: z.string().trim().min(3).max(500) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Enter a cancellation reason of at least three characters." };
  const admin = await requireAdmin();
  try {
    const current = await adminRepository.getOrder(parsed.data.reference);
    if (!current) return { success: false, message: "Order not found." };
    if (await getRoyalMailShipment(current.id)) return { success: false, message: "Reconcile the Royal Mail booking before cancelling this order." };
    await adminRepository.cancelOrder(parsed.data.reference, parsed.data.reason, { userId: admin.userId, displayName: admin.displayName });
    refreshOrder(parsed.data.reference);
    return { success: true, message: "Order cancelled. No Stripe refund was issued." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to cancel the order." };
  }
}

export async function bookRoyalMailAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = parcelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Enter the actual packed weight and all three dimensions in grams and millimetres." };
  const admin = await requireAdmin();
  try {
    const order = await adminRepository.getOrder(parsed.data.reference);
    if (!order) return { success: false, message: "Order not found." };
    await bookRoyalMailShipment(order, parsed.data, { userId: admin.userId, displayName: admin.displayName });
    refreshOrder(order.reference);
    return { success: true, message: "Royal Mail label booked. Print it before handing over the parcel." };
  } catch (error) {
    refreshOrder(parsed.data.reference);
    return { success: false, message: error instanceof Error ? error.message : "Unable to book Royal Mail." };
  }
}

export async function recoverRoyalMailAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = referenceSchema.safeParse(formData.get("reference"));
  if (!parsed.success) return { success: false, message: "Invalid order reference." };
  const admin = await requireAdmin();
  try {
    const order = await adminRepository.getOrder(parsed.data);
    if (!order) return { success: false, message: "Order not found." };
    await recoverRoyalMailShipment(order, { userId: admin.userId, displayName: admin.displayName });
    refreshOrder(order.reference);
    return { success: true, message: "Royal Mail booking recovered." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to recover the booking." };
  }
}

export async function dispatchRoyalMailAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = referenceSchema.safeParse(formData.get("reference"));
  if (!parsed.success) return { success: false, message: "Invalid order reference." };
  const admin = await requireAdmin();
  try {
    const order = await adminRepository.getOrder(parsed.data);
    if (!order) return { success: false, message: "Order not found." };
    await dispatchRoyalMailShipment(order, { userId: admin.userId, displayName: admin.displayName });
    scheduleEmailOutboxProcessing();
    refreshOrder(order.reference);
    return { success: true, message: "Order marked as handed to Royal Mail." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to record dispatch." };
  }
}
// Logout uses a stable POST Route Handler so open tabs survive Server Action ID rotation between deployments.
