"use client";

import Link from "next/link";
import { Minus, Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import content from "@/content/cart.json";
import { formatPrice, getCartTotal, getOrderTotal } from "@/lib/orderPricing";
import { FIXING_OPTIONS, formatPlateSize, getCountryFlagDefinition, getProductRule } from "@/lib/productCatalog";
import { PlatePreview } from "@/components/order/PlatePreview";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";
import type { CartItem } from "@/types/order";

function itemDetails(item: CartItem) {
  const { config } = item;
  const rule = getProductRule(config.productId);
  return [
    formatPlateSize(config),
    rule.innerBorders.length > 1 ? `${config.innerBorder.toLowerCase()} inner border` : "",
    rule.outerBorders.length > 1 ? `${config.outerBorder.toLowerCase()} outer border` : "",
    rule.logos.length > 1 ? config.logo : "",
    config.countryFlag !== "none" ? getCountryFlagDefinition(config.countryFlag).label : "",
    rule.slogan ? (config.sloganMode === "custom" ? `Slogan “${config.sloganText}”` : "No slogan") : "",
    FIXING_OPTIONS[config.fixing].label,
  ].filter(Boolean);
}

export function CartDrawer() {
  const { cartOpen, editCartItem, items, removeCartItem, setCartOpen, setItemQuantity, startAnotherPlate } = useOrderFlow();
  const reduceMotion = useReducedMotion();
  const total = getCartTotal(items);

  return (
    <AnimatePresence initial={false}>
      {cartOpen ? (
        <m.div animate={{ opacity: 1 }} aria-modal="true" className="fixed inset-0 z-50 bg-[var(--overlay)]" exit={{ opacity: reduceMotion ? 1 : 0 }} initial={reduceMotion ? false : { opacity: 0 }} role="dialog" transition={{ duration: reduceMotion ? 0 : 0.18 }}>
          <button aria-label="Close cart" className="absolute inset-0 h-full w-full cursor-default" onClick={() => setCartOpen(false)} type="button" />
          <m.aside animate={{ x: 0 }} className="absolute inset-y-0 right-0 flex w-full max-w-[500px] flex-col border-l border-[var(--line)] bg-[var(--background)] shadow-2xl" exit={{ x: reduceMotion ? 0 : "100%" }} initial={reduceMotion ? false : { x: "100%" }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}>
            <header className="flex min-h-16 items-center justify-between border-b border-[var(--line)] px-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><ShoppingBag aria-hidden size={20} />{content.title}</h2><button aria-label="Close cart" className="grid size-10 place-items-center rounded-md hover:bg-[var(--surface)]" onClick={() => setCartOpen(false)} type="button"><X aria-hidden size={20} /></button></header>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {items.length ? items.map((item) => {
                const lineTotal = getOrderTotal(item.config) * item.quantity;
                return (
                  <article className="panel p-3" key={item.id}>
                    <div className="flex gap-3"><div className="grid w-24 shrink-0 place-items-center rounded-md border border-[var(--line)] bg-[var(--surface-soft)] p-2"><PlatePreview compact config={item.config} /></div><div className="min-w-0 flex-1"><h3 className="font-semibold">{item.config.productName}</h3><p className="mt-1 font-mono text-xs">{item.config.registration || "YOUR REJ"}</p><p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--muted)]">{itemDetails(item).join(" · ")}</p></div></div>
                    <div className="mt-3 flex items-center gap-3"><div className="flex items-center gap-2"><button aria-label="Decrease quantity" className="grid size-8 place-items-center rounded border border-[var(--line-strong)]" onClick={() => setItemQuantity(item.id, item.quantity - 1)} type="button"><Minus aria-hidden size={14} /></button><span className="min-w-4 text-center">{item.quantity}</span><button aria-label="Increase quantity" className="grid size-8 place-items-center rounded border border-[var(--line-strong)]" onClick={() => setItemQuantity(item.id, item.quantity + 1)} type="button"><Plus aria-hidden size={14} /></button></div><m.strong animate={{ opacity: 1, scale: 1 }} className="ml-auto" key={lineTotal}>{formatPrice(lineTotal)}</m.strong></div>
                    <div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><Link className="secondary-button min-h-9 gap-2 py-1 text-xs" href={`/design?product=${item.config.productId}`} onClick={() => editCartItem(item.id)}><Pencil aria-hidden size={14} />{content.edit}</Link><button aria-label={content.remove} className="grid size-9 place-items-center rounded-md border border-[var(--line-strong)]" onClick={() => removeCartItem(item.id)} type="button"><Trash2 aria-hidden size={15} /></button></div>
                  </article>
                );
              }) : <div className="grid min-h-56 place-items-center text-center"><div><ShoppingBag aria-hidden className="mx-auto text-[var(--muted)]" size={32} /><h3 className="mt-4 text-lg font-semibold">{content.emptyTitle}</h3><p className="mt-2 text-sm text-[var(--muted)]">{content.emptyBody}</p></div></div>}
            </div>
            <footer className="border-t border-[var(--line)] p-5"><dl className="space-y-2 text-sm"><div className="flex justify-between text-[var(--muted)]"><dt>{content.subtotal}</dt><dd>{formatPrice(total)}</dd></div><div className="flex justify-between text-[var(--muted)]"><dt>{content.delivery}</dt><dd className="rounded bg-[var(--accent)] px-1.5 font-bold text-[var(--foreground-on-light)]">{content.free}</dd></div><div className="flex justify-between border-t border-[var(--line)] pt-3 font-bold"><dt>{content.total}</dt><dd>{formatPrice(total)}</dd></div></dl><div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]"><Link className="secondary-button" href="/our-plates" onClick={startAnotherPlate}>{content.continue}</Link>{items.length ? <Link className="primary-button" href="/review" onClick={() => setCartOpen(false)}>{content.review}</Link> : <Link className="primary-button" href="/our-plates" onClick={() => setCartOpen(false)}>Explore Our Plates</Link>}</div></footer>
          </m.aside>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
