"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkAdminLoginRateLimit } from "@/lib/rateLimit";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminLoginState = { message: string; errors?: { email?: string[]; password?: string[] } };

const GENERIC_AUTH_ERROR = "The email or password is incorrect, or this account does not have admin access.";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(200),
});

export async function loginAdmin(_state: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const input = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!input.success) return { message: "Check the highlighted fields.", errors: input.error.flatten().fieldErrors };

  const requestHeaders = await headers();
  const identifier = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "local";
  try {
    const rateLimit = await checkAdminLoginRateLimit(identifier);
    if (!rateLimit.allowed) return { message: `Too many sign-in attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` };
  } catch {
    return { message: "Admin sign-in is temporarily unavailable." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(input.data);
  if (error || !data.user) return { message: GENERIC_AUTH_ERROR };

  const { data: admin } = await getSupabaseAdmin()
    .from("admin_users")
    .select("active")
    .eq("user_id", data.user.id)
    .eq("active", true)
    .maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { message: GENERIC_AUTH_ERROR };
  }
  redirect("/admin");
}
