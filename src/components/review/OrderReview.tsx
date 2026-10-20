"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { OrderCard } from "@/components/order/OrderCard";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";
import content from "@/content/review.json";
import { ORDER_NOTES_MAX } from "@/lib/formLimits";
import { formatPrice, getCartTotal } from "@/lib/orderPricing";
import { reviewSchema, type ReviewFormValues } from "@/lib/orderSchemas";

export function OrderReview() {
  const router = useRouter();
  const { editCartItem, items, orderNotes, removeCartItem, setItemQuantity, setOrderNotes, startAnotherPlate } = useOrderFlow();
  const { formState: { errors }, handleSubmit, register } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema), defaultValues: { confirmed: false, orderNotes } });
  const total = getCartTotal(items);

  function submit(values: ReviewFormValues) {
    setOrderNotes(values.orderNotes);
    router.push("/checkout");
  }

  return (
    <div className="site-container py-10 sm:py-14">
      <Breadcrumb current={content.breadcrumb.at(-1) ?? "Review"} />
      <h1 className="page-heading">{content.title}</h1>
      {!items.length ? <div className="panel mt-8 p-6"><p className="text-[var(--muted)]">{content.empty}</p><Link className="primary-button mt-5" href="/our-plates">{content.createPlate}</Link></div> : (
        <>
          <div className="mt-8 space-y-5">{items.map((item) => <div key={item.id}><OrderCard config={item.config} editable editHref={`/design?product=${item.config.productId}`} onEdit={() => editCartItem(item.id)} quantity={item.quantity} /><div className="mt-2 flex justify-end gap-2"><button aria-label="Decrease quantity" className="grid size-9 place-items-center rounded border border-[var(--line-strong)]" onClick={() => setItemQuantity(item.id, item.quantity - 1)} type="button"><Minus aria-hidden size={14} /></button><span className="grid min-w-8 place-items-center">{item.quantity}</span><button aria-label="Increase quantity" className="grid size-9 place-items-center rounded border border-[var(--line-strong)]" onClick={() => setItemQuantity(item.id, item.quantity + 1)} type="button"><Plus aria-hidden size={14} /></button><button aria-label="Remove plate" className="grid size-9 place-items-center rounded border border-[var(--line-strong)]" onClick={() => removeCartItem(item.id)} type="button"><Trash2 aria-hidden size={14} /></button></div></div>)}</div>
          <div className="mt-6 flex justify-end"><Link className="secondary-button" href="/our-plates" onClick={startAnotherPlate}>{content.createAnother}</Link></div>
          <form className="ml-auto mt-6 max-w-[520px]" onSubmit={handleSubmit(submit)}>
            <aside className="panel p-5"><dl className="space-y-2 text-sm"><div className="flex justify-between text-[var(--muted)]"><dt>{content.subtotal}</dt><dd>{formatPrice(total)}</dd></div><div className="flex justify-between text-[var(--muted)]"><dt>{content.delivery}</dt><dd className="rounded bg-[var(--accent)] px-1.5 font-bold text-[var(--foreground-on-light)]">{content.free}</dd></div><div className="flex justify-between border-t border-[var(--line)] pt-3 font-bold"><dt>{content.total}</dt><dd>{formatPrice(total)}</dd></div></dl></aside>
            <label className="mt-5 block text-sm font-medium" htmlFor="order-notes">{content.notesLabel}<textarea className="field mt-2 min-h-24 resize-y" id="order-notes" maxLength={ORDER_NOTES_MAX} placeholder={content.notesPlaceholder} {...register("orderNotes")} /></label>{errors.orderNotes ? <p className="field-error mt-2">{errors.orderNotes.message}</p> : null}
            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm"><input className="mt-1 size-4 accent-[var(--accent)]" type="checkbox" {...register("confirmed")} /><span>{content.confirmation}</span></label>{errors.confirmed ? <p className="field-error mt-2">{errors.confirmed.message}</p> : null}
            <button className="primary-button mt-5 w-full" type="submit">{content.continue}</button>
          </form>
        </>
      )}
    </div>
  );
}
