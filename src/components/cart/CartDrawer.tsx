"use client";

import Link from "next/link";
import { Minus, Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import content from "@/content/cart.json";
import { formatPrice, getOrderTotal } from "@/lib/orderPricing";
import { PlatePreview } from "@/components/order/PlatePreview";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";

export function CartDrawer() {
  const { cartOpen, config, hasCartItem, quantity, setCartOpen, setHasCartItem, setQuantity } = useOrderFlow();
  const reduceMotion = useReducedMotion();

  const total = getOrderTotal(config) * quantity;
  const details = [config.size, `${config.innerBorder.toLowerCase()} inner border`, `${config.outerBorder.toLowerCase()} outer border`, config.logo, config.sloganEnabled ? `Slogan “${config.sloganText}”` : "No slogan"];

  return (
    <AnimatePresence initial={false}>
      {cartOpen ? (
        <m.div animate={{ opacity: 1 }} aria-modal="true" className="fixed inset-0 z-50 bg-[var(--overlay)]" exit={{ opacity: reduceMotion ? 1 : 0 }} initial={reduceMotion ? false : { opacity: 0 }} role="dialog" transition={{ duration: reduceMotion ? 0 : 0.18 }}>
          <button aria-label="Close cart" className="absolute inset-0 h-full w-full cursor-default" onClick={() => setCartOpen(false)} type="button" />
          <m.aside
            animate={{ x: 0 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[450px] flex-col border-l border-[var(--line)] bg-[var(--background)] shadow-2xl"
            exit={{ x: reduceMotion ? 0 : "100%" }}
            initial={reduceMotion ? false : { x: "100%" }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex min-h-16 items-center justify-between border-b border-[var(--line)] px-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><ShoppingBag aria-hidden size={20} />{content.title}</h2>
              <button aria-label="Close cart" className="grid size-10 place-items-center rounded-md hover:bg-[var(--surface)]" onClick={() => setCartOpen(false)} type="button"><X aria-hidden size={20} /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
          {hasCartItem ? (
            <article className="panel p-3">
              <div className="flex gap-3">
                <div className="grid w-24 shrink-0 place-items-center rounded-md border border-[var(--line)] bg-[var(--surface-soft)] p-2"><PlatePreview compact config={config} /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{config.productName}</h3>
                  <p className="mt-1 font-mono text-xs">{config.registration || "YOUR REJ"}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{details.join(" · ")}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button aria-label="Decrease quantity" className="grid size-8 place-items-center rounded border border-[var(--line-strong)]" onClick={() => setQuantity((value) => Math.max(1, value - 1))} type="button"><Minus aria-hidden size={14} /></button>
                  <span className="min-w-4 text-center">{quantity}</span>
                  <button aria-label="Increase quantity" className="grid size-8 place-items-center rounded border border-[var(--line-strong)]" onClick={() => setQuantity((value) => value + 1)} type="button"><Plus aria-hidden size={14} /></button>
                </div>
                <AnimatePresence initial={false} mode="popLayout">
                  <m.strong animate={{ opacity: 1, scale: 1 }} className="ml-auto" initial={reduceMotion ? false : { opacity: 0.55, scale: 0.96 }} key={total} transition={{ duration: reduceMotion ? 0 : 0.18 }}>{formatPrice(total)}</m.strong>
                </AnimatePresence>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <Link className="secondary-button min-h-9 gap-2 py-1 text-xs" href="/design" onClick={() => setCartOpen(false)}><Pencil aria-hidden size={14} />{content.edit}</Link>
                <button aria-label={content.remove} className="grid size-9 place-items-center rounded-md border border-[var(--line-strong)]" onClick={() => setHasCartItem(false)} type="button"><Trash2 aria-hidden size={15} /></button>
              </div>
            </article>
          ) : (
            <div className="grid min-h-56 place-items-center text-center">
              <div><ShoppingBag aria-hidden className="mx-auto text-[var(--muted)]" size={32} /><h3 className="mt-4 text-lg font-semibold">{content.emptyTitle}</h3><p className="mt-2 text-sm text-[var(--muted)]">{content.emptyBody}</p></div>
            </div>
          )}
            </div>

            <footer className="border-t border-[var(--line)] p-5">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-[var(--muted)]"><dt>{content.subtotal}</dt><dd>{formatPrice(hasCartItem ? total : 0)}</dd></div>
            <div className="flex justify-between text-[var(--muted)]"><dt>{content.delivery}</dt><dd className="rounded bg-[var(--accent)] px-1.5 font-bold text-[var(--foreground-on-light)]">{content.free}</dd></div>
            <div className="flex justify-between border-t border-[var(--line)] pt-3 font-bold"><dt>{content.total}</dt><dd>{formatPrice(hasCartItem ? total : 0)}</dd></div>
          </dl>
          <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]">
            <button className="secondary-button" onClick={() => setCartOpen(false)} type="button">{content.continue}</button>
            {hasCartItem ? <Link className="primary-button" href="/review" onClick={() => setCartOpen(false)}>{content.review}</Link> : <Link className="primary-button" href="/design" onClick={() => setCartOpen(false)}>Design Your Plate</Link>}
          </div>
            </footer>
          </m.aside>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
