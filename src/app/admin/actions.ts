"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminRepository } from "@/services/admin.service";
import { requireAdmin } from "@/services/adminAuth.service";

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
    if (current.verificationStatus !== parsed.data.verification) {
      await adminRepository.updateVerification(parsed.data.reference, parsed.data.verification, actor);
    }
    await adminRepository.saveCarrier(parsed.data.reference, parsed.data.carrier, parsed.data.tracking, actor);
    if (current.fulfilmentStatus !== parsed.data.fulfilment) {
      await adminRepository.updateFulfilment(parsed.data.reference, parsed.data.fulfilment, actor, {
        carrier: parsed.data.carrier,
        trackingReference: parsed.data.tracking,
      });
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
    await adminRepository.cancelOrder(parsed.data.reference, parsed.data.reason, { userId: admin.userId, displayName: admin.displayName });
    refreshOrder(parsed.data.reference);
    return { success: true, message: "Order cancelled. No Stripe refund was issued." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to cancel the order." };
  }
}
// Logout uses a stable POST Route Handler so open tabs survive Server Action ID rotation between deployments.
