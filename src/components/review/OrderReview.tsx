"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { OrderCard } from "@/components/order/OrderCard";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";
import { PriceSummary } from "@/components/order/PriceSummary";
import content from "@/content/review.json";
import { reviewSchema, type ReviewFormValues } from "@/lib/orderSchemas";

export function OrderReview() {
  const router = useRouter();
  const { config, quantity, setConfig } = useOrderFlow();
  const { formState: { errors }, handleSubmit, register } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema), defaultValues: { confirmed: false, orderNotes: config.orderNotes } });

  function submit(values: ReviewFormValues) {
    setConfig((current) => ({ ...current, orderNotes: values.orderNotes }));
    router.push("/checkout");
  }

  return (
    <div className="site-container py-10 sm:py-14">
      <Breadcrumb current={content.breadcrumb.at(-1) ?? "Review"} />
      <h1 className="page-heading">{content.title}</h1>
      <div className="mt-8"><OrderCard config={config} editable quantity={quantity} /></div>
      <form className="ml-auto mt-6 max-w-[450px]" onSubmit={handleSubmit(submit)}>
        <PriceSummary config={config} quantity={quantity} />
        <label className="mt-5 block text-sm font-medium" htmlFor="order-notes">{content.notesLabel}<textarea className="field mt-2 min-h-24 resize-y" id="order-notes" placeholder={content.notesPlaceholder} {...register("orderNotes")} /></label>
        {errors.orderNotes ? <p className="field-error mt-2">{errors.orderNotes.message}</p> : null}
        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm"><input className="mt-1 size-4 accent-[var(--accent)]" type="checkbox" {...register("confirmed")} /><span>{content.confirmation}</span></label>
        {errors.confirmed ? <p className="field-error mt-2">{errors.confirmed.message}</p> : null}
        <button className="primary-button mt-5 w-full" type="submit">{content.continue}</button>
      </form>
    </div>
  );
}
