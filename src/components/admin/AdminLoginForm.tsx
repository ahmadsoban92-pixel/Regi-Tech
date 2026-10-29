"use client";

import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useActionState, useState } from "react";
import adminContent from "@/content/admin.json";
import { loginAdmin, type AdminLoginState } from "@/app/admin/login/actions";

const initialState: AdminLoginState = { message: "" };

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);
  const emailError = state.errors?.email?.[0];
  const passwordError = state.errors?.password?.[0];

  return (
    <form action={formAction} className="admin-card admin-card-dark w-full rounded-lg border border-white/10 bg-[#2b2d31] p-6 shadow-sm" noValidate>
      <label className="block text-sm font-medium text-white" htmlFor="admin-email">{adminContent.login.emailLabel}</label>
      <input aria-invalid={Boolean(emailError)} autoComplete="email" className="admin-dark-field mt-1" id="admin-email" maxLength={254} name="email" placeholder={adminContent.login.emailPlaceholder} required type="email" />
      {emailError ? <p className="mt-1.5 text-xs text-red-300" role="alert">{emailError}</p> : null}

      <label className="mt-4 block text-sm font-medium text-white" htmlFor="admin-password">{adminContent.login.passwordLabel}</label>
      <div className="relative mt-1">
        <input aria-invalid={Boolean(passwordError)} autoComplete="current-password" className="admin-dark-field pr-12" id="admin-password" maxLength={200} name="password" placeholder={adminContent.login.passwordPlaceholder} required type={showPassword ? "text" : "password"} />
        <button aria-label={showPassword ? adminContent.login.hidePassword : adminContent.login.showPassword} className="admin-icon-button absolute inset-y-0 right-0 grid w-11 place-items-center text-white/35" onClick={() => setShowPassword((value) => !value)} type="button">
          {showPassword ? <EyeOff aria-hidden size={19} /> : <Eye aria-hidden size={19} />}
        </button>
      </div>
      {passwordError ? <p className="mt-1.5 text-xs text-red-300" role="alert">{passwordError}</p> : null}

      {state.message ? <p aria-live="polite" className="mt-3 text-xs text-red-300">{state.message}</p> : null}

      <button className="admin-primary-action mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[#111] disabled:opacity-60" disabled={pending} type="submit">
        <LogIn aria-hidden size={16} />{pending ? adminContent.login.submitting : adminContent.login.submit}
      </button>
      <Link className="admin-dark-link mt-4 block text-center text-sm text-white/55" href="/">{adminContent.login.back}</Link>
    </form>
  );
}
