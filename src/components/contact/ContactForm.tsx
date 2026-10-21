"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import content from "@/content/contact.json";
import { contactSubmissionSchema, type ContactSubmissionValues } from "@/lib/contactSchemas";
import { CONTACT_EMAIL_MAX, CONTACT_MESSAGE_MAX, CONTACT_NAME_MAX, CONTACT_REFERENCE_MAX } from "@/lib/formLimits";
import type { ApiEnvelope } from "@/types/address";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [requestError, setRequestError] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactSubmissionValues>({
    resolver: zodResolver(contactSubmissionSchema),
    defaultValues: { name: "", email: "", reference: "", message: "", website: "" },
  });

  async function submit(values: ContactSubmissionValues) {
    setStatus("sending"); setRequestError("");
    try {
      const response = await fetch("/api/v1/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const payload = await response.json() as ApiEnvelope<{ received: boolean }>;
      if (!response.ok) { setRequestError(payload.message || content.errors.unavailable); setStatus("idle"); return; }
      setStatus("sent"); reset();
    } catch { setRequestError(content.errors.unavailable); setStatus("idle"); }
  }

  return (
    <form className="panel p-5 sm:p-6" noValidate onSubmit={handleSubmit(submit)}>
      <h2 className="text-lg font-semibold">{content.formTitle}</h2>
      <div className="mt-6 space-y-4">
        <label className="block text-sm"><span className="mb-2 block">{content.fields.name}</span><input className="field" maxLength={CONTACT_NAME_MAX} {...register("name")} />{errors.name ? <span className="field-error mt-1.5 block">{errors.name.message}</span> : null}</label>
        <label className="block text-sm"><span className="mb-2 block">{content.fields.email}</span><input className="field" inputMode="email" maxLength={CONTACT_EMAIL_MAX} type="email" {...register("email")} />{errors.email ? <span className="field-error mt-1.5 block">{errors.email.message}</span> : null}</label>
        <label className="block text-sm"><span className="mb-2 block">{content.fields.reference} <span className="text-[var(--muted)]">({content.fields.optional})</span></span><input className="field" maxLength={CONTACT_REFERENCE_MAX} {...register("reference")} />{errors.reference ? <span className="field-error mt-1.5 block">{errors.reference.message}</span> : null}</label>
        <label className="block text-sm"><span className="mb-2 block">{content.fields.message}</span><textarea className="field min-h-32 resize-y" maxLength={CONTACT_MESSAGE_MAX} {...register("message")} />{errors.message ? <span className="field-error mt-1.5 block">{errors.message.message}</span> : null}</label>
      </div>
      <label aria-hidden className="absolute -left-[10000px]" htmlFor="contact-website">Website<input autoComplete="off" id="contact-website" tabIndex={-1} {...register("website")} /></label>
      <button className="mt-5 min-h-11 w-full rounded-md border border-[var(--accent-muted)] bg-[var(--accent-muted)] px-4 text-sm font-medium text-[var(--foreground-on-light)] disabled:opacity-60" disabled={status === "sending" || status === "sent"} type="submit">{status === "sending" ? content.sending : status === "sent" ? content.sent : content.submit}</button>
      {requestError ? <p aria-live="polite" className="field-error mt-3 text-center">{requestError}</p> : null}
      <p className="mt-4 text-center text-xs text-[var(--muted)]">{content.note}</p>
    </form>
  );
}
