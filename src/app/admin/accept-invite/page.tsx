import type { Metadata } from "next";
import Link from "next/link";
import adminContent from "@/content/admin.json";
import { AcceptInvitationForm, AcceptInvitationFromEmail } from "@/components/admin/AdminInvitationForms";

export const metadata: Metadata = { title: "Accept Admin Invitation", robots: { index: false, follow: false } };

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token_hash?: string }> }) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
  return <main className="grid min-h-dvh place-items-center bg-[#111] px-4 py-12"><div className="admin-card admin-card-dark admin-page-enter w-full max-w-md rounded-lg border border-white/15 bg-[#2b2d31] p-6 text-white shadow-xl"><h1 className="text-2xl font-bold">{adminContent.invitation.title}</h1><p className="mt-2 text-sm text-white/70">{adminContent.invitation.description}</p>{tokenHash ? <AcceptInvitationForm tokenHash={tokenHash} /> : <AcceptInvitationFromEmail />}<Link className="admin-dark-link mt-5 inline-block text-sm text-white/70" href="/admin/login">Back to sign in</Link></div></main>;
}
