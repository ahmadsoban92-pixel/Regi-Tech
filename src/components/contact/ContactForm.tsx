"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import content from "@/content/contact.json";
import { CONTACT_EMAIL_MAX, CONTACT_MESSAGE_MAX, CONTACT_NAME_MAX, CONTACT_REFERENCE_MAX } from "@/lib/formLimits";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(CONTACT_NAME_MAX, `Name must be ${CONTACT_NAME_MAX} characters or fewer.`),
  email: z.string().trim().min(1, "Enter your email address.").max(CONTACT_EMAIL_MAX, `Email must be ${CONTACT_EMAIL_MAX} characters or fewer.`).email("Enter a valid email address."),
  reference: z.string().trim().max(CONTACT_REFERENCE_MAX, `Order reference must be ${CONTACT_REFERENCE_MAX} characters or fewer.`),
  message: z.string().trim().min(1, "Enter your message.").max(CONTACT_MESSAGE_MAX, `Message must be ${CONTACT_MESSAGE_MAX} characters or fewer.`),
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", reference: "", message: "" },
  });

  return (
    <form className="panel p-5 sm:p-6" noValidate onSubmit={handleSubmit(() => undefined)}>
      <h2 className="text-lg font-semibold">{content.formTitle}</h2>
      <div className="mt-6 space-y-4">
        <label className="block text-sm"><span className="mb-2 block">{content.fields.name}</span><input className="field" maxLength={CONTACT_NAME_MAX} {...register("name")} />{errors.name ? <span className="field-error mt-1.5 block">{errors.name.message}</span> : null}</label>
        <label className="block text-sm"><span className="mb-2 block">{content.fields.email}</span><input className="field" inputMode="email" maxLength={CONTACT_EMAIL_MAX} type="email" {...register("email")} />{errors.email ? <span className="field-error mt-1.5 block">{errors.email.message}</span> : null}</label>
        <label className="block text-sm"><span className="mb-2 block">{content.fields.reference} <span className="text-[var(--muted)]">({content.fields.optional})</span></span><input className="field" maxLength={CONTACT_REFERENCE_MAX} {...register("reference")} />{errors.reference ? <span className="field-error mt-1.5 block">{errors.reference.message}</span> : null}</label>
        <label className="block text-sm"><span className="mb-2 block">{content.fields.message}</span><textarea className="field min-h-32 resize-y" maxLength={CONTACT_MESSAGE_MAX} {...register("message")} />{errors.message ? <span className="field-error mt-1.5 block">{errors.message.message}</span> : null}</label>
      </div>
      <button className="mt-5 min-h-11 w-full rounded-md border border-[var(--accent-muted)] bg-[var(--accent-muted)] px-4 text-sm font-medium text-[var(--foreground-on-light)]" type="submit">{content.submit}</button>
      <p className="mt-4 text-center text-xs text-[var(--muted)]">{content.note}</p>
    </form>
  );
}
