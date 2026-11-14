import "server-only";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { AdminSession } from "@/services/adminAuth.service";

export type ManagedAdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "admin";
  active: boolean;
  createdAt: string;
};

export type AdminUserEvent = {
  id: string;
  actorName: string;
  targetEmail: string;
  action: string;
  previousRole: string | null;
  newRole: string | null;
  createdAt: string;
};

function accessError(message: string) {
  if (message.includes("cannot remove your own")) return "You cannot remove your own owner access.";
  if (message.includes("At least one active owner")) return "At least one active owner is required.";
  if (message.includes("Owner access required")) return "Owner access is required.";
  if (message.includes("Administrator not found")) return "Administrator not found.";
  return "Unable to update administrator access.";
}

export async function listAdminUsers() {
  const supabase = getSupabaseAdmin();
  const [users, events] = await Promise.all([
    supabase.from("admin_users").select("user_id,email,display_name,role,active,created_at").order("created_at"),
    supabase.from("admin_user_events").select("id,actor_name,target_email,action,previous_role,new_role,created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  if (users.error || events.error) throw new Error("Unable to load administrator accounts.");
  return {
    users: (users.data ?? []).map((user): ManagedAdminUser => ({
      id: user.user_id,
      email: user.email,
      displayName: user.display_name,
      role: user.role === "owner" ? "owner" : "admin",
      active: user.active,
      createdAt: user.created_at,
    })),
    events: (events.data ?? []).map((event): AdminUserEvent => ({
      id: event.id,
      actorName: event.actor_name,
      targetEmail: event.target_email,
      action: event.action,
      previousRole: event.previous_role,
      newRole: event.new_role,
      createdAt: event.created_at,
    })),
  };
}

export async function inviteAdminUser(input: { email: string; displayName: string; role: "owner" | "admin" }, actor: AdminSession) {
  const supabase = getSupabaseAdmin();
  const email = input.email.toLowerCase().trim();
  const { data: existing, error: lookupError } = await supabase.from("admin_users").select("user_id").eq("email", email).maybeSingle();
  if (lookupError) throw new Error("Unable to check administrator accounts.");
  if (existing) throw new Error("An administrator with this email already exists.");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) throw new Error("The site URL is not configured for invitations.");
  const redirectTo = new URL("/admin/accept-invite", siteUrl).toString();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error || !data.user) throw new Error("Invitation could not be sent. Check the auth email provider and address.");

  const { error: insertError } = await supabase.rpc("admin_invite_user", {
    p_actor_id: actor.userId,
    p_target_id: data.user.id,
    p_email: email,
    p_display_name: input.displayName,
    p_role: input.role,
  });
  if (insertError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw new Error("Invitation was not saved. Please try again.");
  }
}

export async function changeAdminUser(input: { userId: string; role: "owner" | "admin"; active: boolean }, actor: AdminSession) {
  const { error } = await getSupabaseAdmin().rpc("admin_change_user", {
    p_actor_id: actor.userId,
    p_target_id: input.userId,
    p_role: input.role,
    p_active: input.active,
  });
  if (error) throw new Error(accessError(error.message));
}

export async function removeAdminUser(userId: string, actor: AdminSession) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("admin_remove_user", { p_actor_id: actor.userId, p_target_id: userId });
  if (error) throw new Error(accessError(error.message));
  const removed = await supabase.auth.admin.deleteUser(userId);
  if (removed.error) throw new Error("Portal access was removed, but the Auth account needs manual cleanup in Supabase.");
}
