"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkAdminUsersRateLimit } from "@/lib/rateLimit";
import { requireOwner } from "@/services/adminAuth.service";
import { changeAdminUser, inviteAdminUser, removeAdminUser } from "@/services/adminUsers.service";

export type AdminUsersActionState = { success: boolean; message: string };
export const initialAdminUsersActionState: AdminUsersActionState = { success: false, message: "" };

const role = z.enum(["owner", "admin"]);
const inviteSchema = z.object({
  email: z.string().trim().email().max(254),
  displayName: z.string().trim().min(1).max(100),
  role,
});
const changeSchema = z.object({ userId: z.string().uuid(), role, active: z.enum(["true", "false"]) });
const removeSchema = z.object({ userId: z.string().uuid() });

async function authorizeAndLimit() {
  const owner = await requireOwner();
  const limit = await checkAdminUsersRateLimit(owner.userId);
  if (!limit.allowed) throw new Error(`Too many changes. Try again in ${limit.retryAfterSeconds} seconds.`);
  return owner;
}

function result(error: unknown, fallback: string): AdminUsersActionState {
  return { success: false, message: error instanceof Error ? error.message : fallback };
}

export async function inviteAdminAction(_state: AdminUsersActionState, formData: FormData): Promise<AdminUsersActionState> {
  const input = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { success: false, message: "Enter a valid name, email and role." };
  const owner = await authorizeAndLimit();
  try {
    await inviteAdminUser(input.data, owner);
    revalidatePath("/admin/users");
    return { success: true, message: "Invitation sent. The new user can set their own password from the email." };
  } catch (error) {
    return result(error, "Unable to send the invitation.");
  }
}

export async function changeAdminAction(_state: AdminUsersActionState, formData: FormData): Promise<AdminUsersActionState> {
  const input = changeSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { success: false, message: "Invalid account settings." };
  const owner = await authorizeAndLimit();
  try {
    await changeAdminUser({ userId: input.data.userId, role: input.data.role, active: input.data.active === "true" }, owner);
    revalidatePath("/admin/users");
    return { success: true, message: "Administrator access updated." };
  } catch (error) {
    return result(error, "Unable to update access.");
  }
}

export async function removeAdminAction(_state: AdminUsersActionState, formData: FormData): Promise<AdminUsersActionState> {
  const input = removeSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { success: false, message: "Invalid account." };
  const owner = await authorizeAndLimit();
  try {
    await removeAdminUser(input.data.userId, owner);
    revalidatePath("/admin/users");
    return { success: true, message: "Administrator removed." };
  } catch (error) {
    return result(error, "Unable to remove the account.");
  }
}
