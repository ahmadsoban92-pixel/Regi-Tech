"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import shared from "@/content/shared.json";
import type { NavItem } from "@/types/content";
import { useOrderFlow } from "@/components/order/OrderFlowProvider";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const nav = shared.nav as NavItem[];
  const { hasCartItem, quantity, setCartOpen } = useOrderFlow();

  return (
    <>
      <div className="flex min-h-9 items-center justify-center bg-[var(--accent)] px-4 text-center text-xs font-medium text-[var(--foreground-on-light)] sm:text-sm">
        {shared.deliveryBar}
      </div>
      <header className="border-b border-[var(--line)] bg-[var(--background)]">
        <div className="site-container flex h-[76px] items-center justify-between">
          <Link aria-label="Regi-Tech home" href="/">
            <Image alt="Regi-Tech" className="h-auto w-[132px] object-contain sm:w-[150px]" height={75} priority src="/assets/regitech/logo.png" width={150} />
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`border-b-2 py-1 text-sm transition-colors ${active ? "border-[var(--accent)] font-semibold text-[var(--foreground)]" : "border-transparent font-medium text-[var(--label)] hover:text-[var(--foreground)]"}`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button aria-label={`Open cart, ${hasCartItem ? quantity : 0} items`} className="relative grid size-11 place-items-center rounded-md text-[var(--foreground)] hover:bg-[var(--surface)]" onClick={() => setCartOpen(true)} type="button">
              <ShoppingBag aria-hidden size={20} strokeWidth={1.6} />
              <AnimatePresence initial={false}>
                {hasCartItem ? <m.span animate={{ opacity: 1, scale: 1 }} className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[0.6rem] font-bold text-[var(--foreground-on-light)]" exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.75 }} initial={reduceMotion ? false : { opacity: 0, scale: 0.75 }} key={quantity}>{quantity}</m.span> : null}
              </AnimatePresence>
            </button>
            <Link className="primary-button" href="/design">
              {shared.primaryCta}
            </Link>
          </div>

          <button
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
            className="grid size-11 place-items-center rounded-md border border-[var(--line)] text-[var(--foreground)] lg:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X aria-hidden size={22} /> : <Menu aria-hidden size={22} />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open ? (
          <m.nav
            animate={{ height: "auto", opacity: 1 }}
            aria-label="Mobile navigation"
            className="site-container flex flex-col gap-1 overflow-hidden border-t border-[var(--line)] py-4 lg:hidden"
            exit={{ height: reduceMotion ? "auto" : 0, opacity: reduceMotion ? 1 : 0 }}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {nav.map((item) => (
              <Link
                className={`rounded-md px-3 py-3 text-sm ${pathname === item.href ? "bg-[var(--surface)] font-semibold text-[var(--foreground)]" : "text-[var(--label)]"}`}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button className="secondary-button mt-2" onClick={() => { setOpen(false); setCartOpen(true); }} type="button">Open Cart{hasCartItem ? ` (${quantity})` : ""}</button>
            <Link className="primary-button mt-2" href="/design" onClick={() => setOpen(false)}>
              {shared.primaryCta}
            </Link>
          </m.nav>
          ) : null}
        </AnimatePresence>
      </header>
    </>
  );
}
