"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import adminContent from "@/content/admin.json";

export function AdminLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = adminContent.login.errors.email;
    if (!password) nextErrors.password = adminContent.login.errors.password;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    startTransition(() => router.push("/admin"));
  }

  return (
    <form className="w-full rounded-lg border border-white/10 bg-[#2b2d31] p-6 shadow-sm" noValidate onSubmit={submit}>
      <label className="block text-sm font-medium text-white" htmlFor="admin-email">{adminContent.login.emailLabel}</label>
      <input aria-invalid={Boolean(errors.email)} autoComplete="email" className="admin-dark-field mt-1" id="admin-email" name="email" placeholder={adminContent.login.emailPlaceholder} type="email" />
      {errors.email ? <p className="mt-1.5 text-xs text-red-300" role="alert">{errors.email}</p> : null}

      <label className="mt-4 block text-sm font-medium text-white" htmlFor="admin-password">{adminContent.login.passwordLabel}</label>
      <div className="relative mt-1">
        <input aria-invalid={Boolean(errors.password)} autoComplete="current-password" className="admin-dark-field pr-12" id="admin-password" name="password" placeholder={adminContent.login.passwordPlaceholder} type={showPassword ? "text" : "password"} />
        <button aria-label={showPassword ? adminContent.login.hidePassword : adminContent.login.showPassword} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-white/35 hover:text-white/70" onClick={() => setShowPassword((value) => !value)} type="button">
          {showPassword ? <EyeOff aria-hidden size={19} /> : <Eye aria-hidden size={19} />}
        </button>
      </div>
      {errors.password ? <p className="mt-1.5 text-xs text-red-300" role="alert">{errors.password}</p> : null}

      <button className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[#111] transition-transform active:scale-[0.99] disabled:opacity-60" disabled={pending} type="submit">
        <LogIn aria-hidden size={16} />{pending ? adminContent.login.submitting : adminContent.login.submit}
      </button>
      <Link className="mt-4 block text-center text-sm text-white/55 hover:text-white" href="/">{adminContent.login.back}</Link>
    </form>
  );
}
