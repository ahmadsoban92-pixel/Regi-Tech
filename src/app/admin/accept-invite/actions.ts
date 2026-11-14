"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/services/adminAuth.service";

export type InvitationActionState = { success: boolean; message: string };
export const initialInvitationActionState: InvitationActionState = { success: false, message: "" };

export async function acceptInvitation(_state: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  const parsed = z.string().min(20).max(512).safeParse(formData.get("tokenHash"));
  if (!parsed.success) return { success: false, message: "This invitation link is invalid." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: parsed.data, type: "invite" });
  if (error || !data.user) return { success: false, message: "This invitation has expired or has already been used. Ask an owner for a new invitation." };
  const { data: allowed } = await getSupabaseAdmin().from("admin_users").select("active").eq("user_id", data.user.id).eq("active", true).maybeSingle();
  if (!allowed) {
    await supabase.auth.signOut();
    return { success: false, message: "This invitation no longer grants admin access." };
  }
  redirect("/admin/set-password");
}

export async function setInvitedPassword(_state: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  await requireAdmin();
  const parsed = z.object({
    password: z.string().min(12).max(200),
    confirmPassword: z.string(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Use a password of at least 12 characters." };
  if (parsed.data.password !== parsed.data.confirmPassword) return { success: false, message: "The passwords do not match." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { success: false, message: "Unable to save your password. Please try again." };
  redirect("/admin");
}
