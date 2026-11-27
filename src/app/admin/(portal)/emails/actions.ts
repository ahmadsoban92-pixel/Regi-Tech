"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { scheduleEmailOutboxProcessing } from "@/lib/emailScheduling";
import { requireOwner } from "@/services/adminAuth.service";
import { retryEmailDelivery } from "@/services/adminEmails.service";

export type EmailRetryActionState = { success: boolean; message: string };
export const initialEmailRetryActionState: EmailRetryActionState = { success: false, message: "" };

export async function retryEmailAction(
  _state: EmailRetryActionState,
  formData: FormData,
): Promise<EmailRetryActionState> {
  const parsed = z.string().uuid().safeParse(formData.get("id"));
  if (!parsed.success) return { success: false, message: "Invalid email delivery." };
  await requireOwner();
  try {
    await retryEmailDelivery(parsed.data);
    scheduleEmailOutboxProcessing();
    revalidatePath("/admin/emails");
    return { success: true, message: "Email queued for another delivery attempt." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to retry this email." };
  }
}
