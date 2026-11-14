"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useActionState, useEffect, useState } from "react";
import adminContent from "@/content/admin.json";
import { acceptInvitation, initialInvitationActionState, setInvitedPassword } from "@/app/admin/accept-invite/actions";

export function AcceptInvitationForm({ tokenHash }: { tokenHash: string }) {
  const [state, action, pending] = useActionState(acceptInvitation, initialInvitationActionState);
  return <form action={action} className="mt-6"><input name="tokenHash" type="hidden" value={tokenHash} /><button className="admin-primary-action w-full rounded-md bg-[var(--accent)] px-4 py-3 font-semibold text-[#111] disabled:opacity-60" disabled={pending} type="submit">{pending ? adminContent.invitation.confirming : adminContent.invitation.confirm}</button>{state.message ? <p aria-live="polite" className="mt-3 text-sm text-red-300">{state.message}</p> : null}</form>;
}

export function AcceptInvitationFromEmail() {
  const [message, setMessage] = useState(adminContent.invitation.confirming);
  useEffect(() => {
    const tokens = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = tokens.get("access_token");
    const refreshToken = tokens.get("refresh_token");
    if (!accessToken || !refreshToken) {
      setMessage(adminContent.invitation.invalid);
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    void supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (error) setMessage(adminContent.invitation.invalid);
      else window.location.replace("/admin/set-password");
    }).catch(() => setMessage(adminContent.invitation.invalid));
  }, []);
  return <p aria-live="polite" className="mt-6 text-sm text-white/75">{message}</p>;
}

export function SetAdminPasswordForm() {
  const [state, action, pending] = useActionState(setInvitedPassword, initialInvitationActionState);
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-white">
        {adminContent.invitation.password}
        <input autoComplete="new-password" className="admin-dark-field mt-1" minLength={12} name="password" required type="password" />
      </label>
      <label className="block text-sm font-medium text-white">
        {adminContent.invitation.confirmPassword}
        <input autoComplete="new-password" className="admin-dark-field mt-1" minLength={12} name="confirmPassword" required type="password" />
      </label>
      <button className="admin-primary-action w-full rounded-md bg-[var(--accent)] px-4 py-3 font-semibold text-[#111] disabled:opacity-60" disabled={pending} type="submit">
        {pending ? adminContent.invitation.savingPassword : adminContent.invitation.savePassword}
      </button>
      {state.message ? <p aria-live="polite" className="text-sm text-red-300">{state.message}</p> : null}
    </form>
  );
}
