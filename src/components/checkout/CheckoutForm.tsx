"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PlatePreview } from "@/components/order/PlatePreview";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";
import content from "@/content/checkout.json";
import { formatPrice, getOrderTotal } from "@/lib/orderPricing";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/orderSchemas";

type FieldName = Exclude<keyof CheckoutFormValues, "billingSameAsDelivery">;

export function CheckoutForm() {
  const router = useRouter();
  const { config, customer, quantity, setCustomer } = useOrderFlow();
  const { formState: { errors }, handleSubmit, register } = useForm<CheckoutFormValues>({ resolver: zodResolver(checkoutSchema), defaultValues: customer });
  const total = getOrderTotal(config) * quantity;

  function submit(values: CheckoutFormValues) {
    setCustomer(values);
    router.push("/order-confirmation");
  }

  function input(name: FieldName, label: string, type = "text") {
    const error = errors[name];
    return <label className="block text-xs font-medium" htmlFor={name}>{label}<input aria-invalid={Boolean(error)} className="field mt-2" id={name} type={type} {...register(name)} />{error ? <span className="field-error mt-2 block">{error.message}</span> : null}</label>;
  }

  return (
    <div className="site-container py-10 sm:py-14">
      <Breadcrumb current={content.breadcrumb.at(-1) ?? "Checkout"} />
      <h1 className="page-heading">{content.title}</h1>
      <form className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]" onSubmit={handleSubmit(submit)}>
        <div>
          <section><h2 className="text-lg font-semibold">{content.contactTitle}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">{input("firstName", content.fields.firstName)}{input("lastName", content.fields.lastName)}{input("email", content.fields.email, "email")}{input("telephone", content.fields.telephone, "tel")}</div></section>
          <section className="mt-8"><h2 className="text-lg font-semibold">{content.deliveryTitle}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2">{input("addressLine1", content.fields.addressLine1)}</div><div className="sm:col-span-2">{input("addressLine2", content.fields.addressLine2)}</div>{input("town", content.fields.town)}{input("postcode", content.fields.postcode)}<label className="block text-xs font-medium sm:col-span-2" htmlFor="country">{content.fields.country}<input className="field mt-2" id="country" readOnly {...register("country")} /></label></div></section>
          <label className="mt-5 flex items-center gap-3 text-sm"><input className="size-4 accent-[var(--accent)]" type="checkbox" {...register("billingSameAsDelivery")} />{content.fields.billingSame}</label>
          <section className="panel mt-7 p-5"><h2 className="text-sm font-semibold">{content.delivery.title}</h2><p className="mt-2 text-sm">{content.delivery.method}</p><p className="mt-1 text-xs text-[var(--muted)]">{content.delivery.estimate}</p></section>
          <label className="mt-6 block text-xs font-medium" htmlFor="additionalNotes">{content.fields.notes}<textarea className="field mt-2 min-h-24 resize-y" id="additionalNotes" {...register("additionalNotes")} /></label>{errors.additionalNotes ? <p className="field-error mt-2">{errors.additionalNotes.message}</p> : null}
        </div>

        <aside className="panel p-5 lg:sticky lg:top-5">
          <h2 className="text-base font-semibold">{content.summary}</h2>
          <div className="mt-4 flex items-center gap-3 border-b border-[var(--line)] pb-4"><div className="w-16 rounded bg-[var(--surface-soft)] p-1"><PlatePreview compact config={config} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{config.productName}</p><p className="font-mono text-xs">{config.registration || "YOUR REJ"}</p><p className="text-xs text-[var(--muted)]">× {quantity}</p></div><strong className="text-sm">{formatPrice(total)}</strong></div>
          <dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between text-[var(--muted)]"><dt>{content.subtotal}</dt><dd>{formatPrice(total)}</dd></div><div className="flex justify-between text-[var(--muted)]"><dt>{content.deliveryLabel}</dt><dd className="rounded bg-[var(--accent)] px-1.5 text-xs font-bold text-[var(--foreground-on-light)]">{content.free}</dd></div><div className="flex justify-between border-t border-[var(--line)] pt-3 font-bold"><dt>{content.total}</dt><dd>{formatPrice(total)}</dd></div></dl>
          <button className="secondary-button mt-5 w-full text-xs" type="submit">{content.submit}</button>
        </aside>
      </form>
    </div>
  );
}
