"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { AddressLookupFields } from "@/components/checkout/AddressLookupFields";
import { ArtworkUploadSection } from "@/components/checkout/ArtworkUploadSection";
import { V5cUploadSection } from "@/components/checkout/V5cUploadSection";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PlatePreview } from "@/components/order/PlatePreview";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";
import content from "@/content/checkout.json";
import { CHECKOUT_EMAIL_MAX, CHECKOUT_NAME_MAX, CHECKOUT_TELEPHONE_MAX, ORDER_NOTES_MAX } from "@/lib/formLimits";
import { formatPrice, getCartTotal, getOrderTotal } from "@/lib/orderPricing";
import { createCheckoutSchema, type CheckoutFormValues } from "@/lib/orderSchemas";
import type { ApiEnvelope } from "@/types/address";
import type { CheckoutSessionData, CheckoutSubmission } from "@/types/orderApi";

type ContactFieldName = "firstName" | "lastName" | "email" | "telephone";
type CheckoutFormProps = { cancelledReference?: string };

export function CheckoutForm({ cancelledReference }: CheckoutFormProps) {
  const { artworkFiles, customer, editCartItem, items, orderNotes, removeCartItem, setArtworkFileForItem, setCustomer, setItemQuantity } = useOrderFlow();
  const [v5cFiles, setV5cFiles] = useState<Record<string, File>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [requestStatus, setRequestStatus] = useState<"idle" | "submitting" | "retrying">("idle");
  const [requestError, setRequestError] = useState("");
  const methods = useForm<CheckoutFormValues>({ resolver: zodResolver(createCheckoutSchema()), defaultValues: customer });
  const { formState: { errors }, handleSubmit, register, watch } = methods;
  const billingSameAsDelivery = watch("billingSameAsDelivery");
  const total = getCartTotal(items);

  async function submit(values: CheckoutFormValues) {
    const nextErrors: Record<string, string> = {};
    for (const item of items) {
      if (item.config.useType === "road-legal" && !v5cFiles[item.id]) nextErrors[`v5c-${item.id}`] = content.v5c.required;
      if (item.config.logo === "Other Logo" && !artworkFiles[item.id]) nextErrors[`artwork-${item.id}`] = content.errors.artworkRequired;
    }
    setFileErrors(nextErrors);
    if (!items.length) { setRequestError(content.errors.emptyCart); return; }
    if (Object.keys(nextErrors).length) return;

    setRequestStatus("submitting");
    setRequestError("");
    setCustomer(values);
    const submission: CheckoutSubmission = {
      items: items.map((item) => ({ ...item, config: { ...item.config, uploadedLogoPreviewUrl: "" } })),
      customer: values,
      orderNotes,
    };
    const formData = new FormData();
    formData.set("order", JSON.stringify(submission));
    for (const item of items) {
      const v5c = v5cFiles[item.id];
      const artwork = artworkFiles[item.id];
      if (v5c) formData.set(`v5c-${item.id}`, v5c);
      if (artwork) formData.set(`artwork-${item.id}`, artwork);
    }
    try {
      const response = await fetch("/api/v1/orders/checkout", { method: "POST", body: formData, credentials: "include" });
      const payload = await response.json() as ApiEnvelope<CheckoutSessionData>;
      if (!response.ok || !payload.data?.checkoutUrl) { setRequestError(payload.message || content.errors.unavailable); return; }
      window.location.assign(payload.data.checkoutUrl);
    } catch {
      setRequestError(content.errors.unavailable);
    } finally {
      setRequestStatus("idle");
    }
  }

  async function retryPayment() {
    if (!cancelledReference) return;
    setRequestError(""); setRequestStatus("retrying");
    try {
      const response = await fetch(`/api/v1/orders/${encodeURIComponent(cancelledReference)}/retry`, { method: "POST", credentials: "include" });
      const payload = await response.json() as ApiEnvelope<CheckoutSessionData>;
      if (!response.ok || !payload.data?.checkoutUrl) { setRequestError(payload.message || content.errors.unavailable); return; }
      window.location.assign(payload.data.checkoutUrl);
    } catch { setRequestError(content.errors.unavailable); }
    finally { setRequestStatus("idle"); }
  }

  function input(name: ContactFieldName, label: string, type = "text") {
    const error = errors[name];
    const maximum = name === "email" ? CHECKOUT_EMAIL_MAX : name === "telephone" ? CHECKOUT_TELEPHONE_MAX : CHECKOUT_NAME_MAX;
    return <label className="block text-xs font-medium" htmlFor={name}>{label}<input aria-invalid={Boolean(error)} className="field mt-2" id={name} maxLength={maximum} type={type} {...register(name)} />{error ? <span className="field-error mt-2 block">{error.message}</span> : null}</label>;
  }

  return (
    <div className="site-container py-10 sm:py-14">
      <Breadcrumb current={content.breadcrumb.at(-1) ?? "Checkout"} /><h1 className="page-heading">{content.title}</h1>
      {cancelledReference ? <section className="panel mt-6 border-[var(--accent-border)] p-5"><h2 className="text-base font-semibold">{content.cancelled.title}</h2><p className="mt-2 text-sm text-[var(--muted)]">{content.cancelled.body}</p><button className="primary-button mt-4" disabled={requestStatus !== "idle"} onClick={retryPayment} type="button">{requestStatus === "retrying" ? content.cancelled.retrying : content.cancelled.retry}</button></section> : null}
      {!items.length ? <section className="panel mt-8 p-6"><p className="text-[var(--muted)]">{content.errors.emptyCart}</p><Link className="primary-button mt-5" href="/our-plates">Explore Our Plates</Link></section> : (
        <FormProvider {...methods}><form className="mt-8 grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-7 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]" onSubmit={handleSubmit(submit)}>
          <div className="min-w-0">
            <section><h2 className="text-lg font-semibold">{content.contactTitle}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">{input("firstName", content.fields.firstName)}{input("lastName", content.fields.lastName)}{input("email", content.fields.email, "email")}{input("telephone", content.fields.telephone, "tel")}</div></section>
            <AddressLookupFields prefix="deliveryAddress" title={content.deliveryTitle} />
            <label className="mt-5 flex items-center gap-3 text-sm"><input className="size-4 accent-[var(--accent)]" type="checkbox" {...register("billingSameAsDelivery")} />{content.fields.billingSame}</label>
            {!billingSameAsDelivery ? <AddressLookupFields prefix="billingAddress" title={content.billingTitle} /> : null}
            {items.map((item, index) => <div key={item.id}>{item.config.useType === "road-legal" ? <V5cUploadSection error={fileErrors[`v5c-${item.id}`]} file={v5cFiles[item.id] ?? null} inputId={`v5c-${item.id}`} onFileChange={(file, error) => { setV5cFiles((current) => { const next = { ...current }; if (file) next[item.id] = file; else delete next[item.id]; return next; }); setFileErrors((current) => ({ ...current, [`v5c-${item.id}`]: error ?? "" })); }} plateLabel={`Plate ${index + 1}: ${item.config.registration}`} /> : null}{item.config.logo === "Other Logo" ? <ArtworkUploadSection error={fileErrors[`artwork-${item.id}`]} file={artworkFiles[item.id] ?? null} inputId={`artwork-${item.id}`} onFileChange={(file, error) => { setArtworkFileForItem(item.id, file); setFileErrors((current) => ({ ...current, [`artwork-${item.id}`]: error ?? "" })); }} plateLabel={`Plate ${index + 1}: ${item.config.registration}`} /> : null}</div>)}
            <section className="panel mt-7 p-5"><h2 className="text-sm font-semibold">{content.delivery.title}</h2><p className="mt-2 text-sm">{content.delivery.method}</p><p className="mt-1 text-xs text-[var(--muted)]">{content.delivery.estimate}</p></section>
            <label className="mt-6 block text-xs font-medium" htmlFor="additionalNotes">{content.fields.notes}<textarea className="field mt-2 min-h-24 resize-y" id="additionalNotes" maxLength={ORDER_NOTES_MAX} {...register("additionalNotes")} /></label>{errors.additionalNotes ? <p className="field-error mt-2">{errors.additionalNotes.message}</p> : null}
          </div>
          <aside className="panel min-w-0 p-5 lg:sticky lg:top-5"><h2 className="text-base font-semibold">{content.summary}</h2><div className="mt-4 space-y-3">{items.map((item) => <div className="border-b border-[var(--line)] pb-3" key={item.id}><div className="flex items-center gap-3"><div className="w-16 rounded bg-[var(--surface-soft)] p-1"><PlatePreview compact config={item.config} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{item.config.productName}</p><p className="font-mono text-xs">{item.config.registration || "YOUR REJ"}</p><p className="text-xs text-[var(--muted)]">× {item.quantity}</p></div><strong className="text-xs">{formatPrice(getOrderTotal(item.config) * item.quantity)}</strong></div><div className="mt-2 flex flex-wrap gap-2 text-xs"><Link className="rounded border border-[var(--line-strong)] px-2 py-1" href={`/design?product=${item.config.productId}`} onClick={() => editCartItem(item.id)}>Edit</Link><button className="rounded border border-[var(--line-strong)] px-2 py-1" onClick={() => setItemQuantity(item.id, item.quantity - 1)} type="button">−</button><button className="rounded border border-[var(--line-strong)] px-2 py-1" onClick={() => setItemQuantity(item.id, item.quantity + 1)} type="button">+</button><button className="rounded border border-[var(--line-strong)] px-2 py-1 text-[var(--destructive)]" onClick={() => removeCartItem(item.id)} type="button">Remove</button></div></div>)}</div><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between text-[var(--muted)]"><dt>{content.subtotal}</dt><dd>{formatPrice(total)}</dd></div><div className="flex justify-between text-[var(--muted)]"><dt>{content.deliveryLabel}</dt><dd className="rounded bg-[var(--accent)] px-1.5 text-xs font-bold text-[var(--foreground-on-light)]">{content.free}</dd></div><div className="flex justify-between border-t border-[var(--line)] pt-3 font-bold"><dt>{content.total}</dt><dd>{formatPrice(total)}</dd></div></dl><p className="mt-4 text-xs leading-5 text-[var(--muted)]">{content.paymentExplainer}</p>{requestError ? <p aria-live="polite" className="field-error mt-4">{requestError}</p> : null}<button className="primary-button mt-5 w-full text-xs" disabled={requestStatus !== "idle"} type="submit">{requestStatus === "submitting" ? content.submitting : content.submit}</button></aside>
        </form></FormProvider>
      )}
    </div>
  );
}
