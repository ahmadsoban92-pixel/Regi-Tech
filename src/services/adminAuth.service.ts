import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string;
  displayName: string;
  role: "owner" | "admin";
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const auth = await createSupabaseServerClient();
  const { data, error } = await auth.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  if (error || !userId) return null;

  const { data: admin, error: adminError } = await getSupabaseAdmin()
    .from("admin_users")
    .select("user_id,email,display_name,role,active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (adminError || !admin || (admin.role !== "owner" && admin.role !== "admin")) return null;
  return {
    userId: admin.user_id,
    email: admin.email,
    displayName: admin.display_name || admin.email,
    role: admin.role,
  };
}

export async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return admin;
}
