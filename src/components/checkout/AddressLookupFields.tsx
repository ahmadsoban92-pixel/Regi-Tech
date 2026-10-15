"use client";

import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import content from "@/content/checkout.json";
import type { CheckoutFormValues } from "@/lib/orderSchemas";
import { CHECKOUT_ADDRESS_MAX, CHECKOUT_COUNTRY_MAX, CHECKOUT_POSTCODE_MAX, CHECKOUT_TOWN_MAX } from "@/lib/formLimits";
import type { AddressLookupData, ApiEnvelope, NormalizedAddress } from "@/types/address";

type AddressPrefix = "deliveryAddress" | "billingAddress";

export function AddressLookupFields({ prefix, title }: { prefix: AddressPrefix; title: string }) {
  const { formState: { errors }, register, setValue, watch } = useFormContext<CheckoutFormValues>();
  const names = prefix === "deliveryAddress" ? {
    addressLine1: "deliveryAddress.addressLine1" as const,
    addressLine2: "deliveryAddress.addressLine2" as const,
    town: "deliveryAddress.town" as const,
    county: "deliveryAddress.county" as const,
    postcode: "deliveryAddress.postcode" as const,
    country: "deliveryAddress.country" as const,
  } : {
    addressLine1: "billingAddress.addressLine1" as const,
    addressLine2: "billingAddress.addressLine2" as const,
    town: "billingAddress.town" as const,
    county: "billingAddress.county" as const,
    postcode: "billingAddress.postcode" as const,
    country: "billingAddress.country" as const,
  };
  const fieldErrors = errors[prefix];
  const postcode = watch(names.postcode);
  const [addresses, setAddresses] = useState<NormalizedAddress[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "not-found" | "unavailable" | "rate-limited">("idle");
  const requestRef = useRef<AbortController | null>(null);

  function applyAddress(address: NormalizedAddress) {
    setValue(names.addressLine1, address.addressLine1, { shouldDirty: true, shouldValidate: true });
    setValue(names.addressLine2, address.addressLine2, { shouldDirty: true, shouldValidate: true });
    setValue(names.town, address.town, { shouldDirty: true, shouldValidate: true });
    setValue(names.county, address.county, { shouldDirty: true, shouldValidate: true });
    setValue(names.postcode, address.postcode, { shouldDirty: true, shouldValidate: true });
    setValue(names.country, address.country, { shouldDirty: true, shouldValidate: true });
  }

  async function findAddresses(nextPage = 0, suggestedPostcode?: string) {
    const queryPostcode = (suggestedPostcode ?? postcode).trim();
    if (!queryPostcode) return;
    if (suggestedPostcode) setValue(names.postcode, suggestedPostcode, { shouldDirty: true, shouldValidate: true });
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");
    try {
      const response = await fetch(`/api/v1/address-lookup?postcode=${encodeURIComponent(queryPostcode)}&page=${nextPage}`, { credentials: "include", signal: controller.signal });
      const payload = await response.json() as ApiEnvelope<AddressLookupData>;
      if (response.status === 429) {
        setStatus("rate-limited");
        return;
      }
      if (!response.ok || !payload.data) {
        setStatus("unavailable");
        return;
      }
      setAddresses((current) => nextPage === 0 ? payload.data!.addresses : [...current, ...payload.data!.addresses.filter((address) => !current.some((item) => item.id === address.id))]);
      setSuggestions(payload.data.suggestions);
      setTotal(payload.data.total);
      setPage(nextPage);
      setStatus(payload.data.addresses.length || nextPage > 0 ? "idle" : "not-found");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("unavailable");
    }
  }

  function input(name: keyof typeof names, label: string) {
    const fieldName = names[name];
    const error = fieldErrors?.[name];
    const maximum = name === "postcode" ? CHECKOUT_POSTCODE_MAX : name === "country" ? CHECKOUT_COUNTRY_MAX : name === "town" || name === "county" ? CHECKOUT_TOWN_MAX : CHECKOUT_ADDRESS_MAX;
    return <label className="block text-xs font-medium" htmlFor={fieldName}>{label}<input aria-invalid={Boolean(error)} className="field mt-2" id={fieldName} maxLength={maximum} {...register(fieldName)} />{error ? <span className="field-error mt-2 block">{error.message}</span> : null}</label>;
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="panel mt-5 p-4 sm:p-5">
        <label className="block text-xs font-medium" htmlFor={`${prefix}-lookup-postcode`}>{content.lookup.label}</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input className="field" id={`${prefix}-lookup-postcode`} maxLength={CHECKOUT_POSTCODE_MAX} onChange={(event) => setValue(names.postcode, event.target.value, { shouldDirty: true })} value={postcode} />
          <button className="primary-button shrink-0" disabled={status === "loading" || !postcode.trim()} onClick={() => findAddresses()} type="button">{status === "loading" ? content.lookup.loading : content.lookup.button}</button>
        </div>
        {addresses.length ? <label className="mt-4 block text-xs font-medium" htmlFor={`${prefix}-address-result`}>{content.lookup.select}<select className="field mt-2" defaultValue="" id={`${prefix}-address-result`} onChange={(event) => { const address = addresses.find((item) => item.id === event.target.value); if (address) applyAddress(address); }}><option disabled value="">{content.lookup.selectPlaceholder}</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.label}</option>)}</select></label> : null}
        {suggestions.length ? <div className="mt-4 text-xs text-[var(--muted)]"><span>{content.lookup.suggestions}</span><div className="mt-2 flex flex-wrap gap-2">{suggestions.map((suggestion) => <button className="rounded border border-[var(--line-strong)] px-2 py-1 text-[var(--foreground)]" key={suggestion} onClick={() => findAddresses(0, suggestion)} type="button">{suggestion}</button>)}</div></div> : null}
        {status === "not-found" ? <p aria-live="polite" className="mt-3 text-xs text-[var(--muted)]">{content.lookup.notFound}</p> : null}
        {status === "unavailable" ? <p aria-live="polite" className="mt-3 text-xs text-[var(--muted)]">{content.lookup.unavailable}</p> : null}
        {status === "rate-limited" ? <p aria-live="polite" className="mt-3 text-xs text-[var(--muted)]">{content.lookup.rateLimited}</p> : null}
        {addresses.length < total ? <button className="secondary-button mt-4 min-h-8 px-3 py-1 text-xs" disabled={status === "loading"} onClick={() => findAddresses(page + 1)} type="button">{content.lookup.loadMore}</button> : null}
      </div>
      <p className="mt-4 text-xs text-[var(--muted)]">{content.lookup.manual}</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">{input("addressLine1", content.fields.addressLine1)}</div>
        <div className="sm:col-span-2">{input("addressLine2", content.fields.addressLine2)}</div>
        {input("town", content.fields.town)}
        {input("county", content.fields.county)}
        {input("postcode", content.fields.postcode)}
        {input("country", content.fields.country)}
      </div>
    </section>
  );
}
