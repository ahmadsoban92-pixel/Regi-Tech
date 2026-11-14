import type { Metadata } from "next";
import adminContent from "@/content/admin.json";
import { SetAdminPasswordForm } from "@/components/admin/AdminInvitationForms";
import { requireAdmin } from "@/services/adminAuth.service";

export const metadata: Metadata = { title: "Set Admin Password", robots: { index: false, follow: false } };

export default async function SetPasswordPage() {
  await requireAdmin();
  return <main className="grid min-h-dvh place-items-center bg-[#111] px-4 py-12"><div className="admin-card admin-card-dark admin-page-enter w-full max-w-md rounded-lg border border-white/15 bg-[#2b2d31] p-6 text-white shadow-xl"><h1 className="text-2xl font-bold">{adminContent.invitation.passwordTitle}</h1><p className="mt-2 text-sm text-white/70">{adminContent.invitation.passwordDescription}</p><SetAdminPasswordForm /></div></main>;
}
