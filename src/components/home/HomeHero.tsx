"use client";

import { useState } from "react";
import { CirclePlay } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ManufacturingProcessDialog } from "@/components/products/ManufacturingProcessDialog";
import content from "@/content/home.json";
import productData from "@/content/products.json";
import type { Product } from "@/types/content";

const processProduct = (productData as Product[]).find((product) => product.id === "hand-crafted-show-plate") ?? null;

export function HomeHero() {
  const [processOpen, setProcessOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-[620px] overflow-hidden md:min-h-[720px]">
        <div className="absolute inset-0 bg-[url('/assets/regitech/hero-ab99-cde.png')] bg-cover bg-[65%_center] md:bg-center" />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,var(--background))]" />
        <div className="site-container relative flex min-h-[620px] items-center py-20 md:min-h-[720px] md:py-24">
          <div className="max-w-[720px] pt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--label)] sm:text-sm">{content.eyebrow}</p>
            <h1 className="mt-4 text-[clamp(3.3rem,9vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">
              {content.titleLine1.slice(0, -1)}<span className="text-[var(--accent)]">.</span><br /><span className="text-[var(--accent)]">{content.titleLine2}</span>
            </h1>
            <p className="mt-6 max-w-[500px] text-base leading-7 text-[var(--label)] sm:text-lg">{content.heroBody}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink className="min-h-12 px-8" href="/our-plates">{content.heroSecondary}</ButtonLink>
              {processProduct ? (
                <button
                  aria-haspopup="dialog"
                  className="secondary-button group min-h-12 gap-2.5 border-[var(--accent-border)] bg-black/45 px-7 text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-sm hover:border-[var(--accent)] hover:bg-[var(--surface)]"
                  onClick={() => setProcessOpen(true)}
                  type="button"
                >
                  <CirclePlay aria-hidden className="text-[var(--accent)] transition-transform duration-200 group-hover:scale-110" size={21} strokeWidth={1.8} />
                  {content.heroProcessCta}
                </button>
              ) : null}
            </div>
            <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--label)]">
              {content.proofPoints.map((point, index) => (
                <span className="flex items-center gap-4" key={point}>{index > 0 ? <span className="text-[var(--accent)]">•</span> : null}{point}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
      <ManufacturingProcessDialog onClose={() => setProcessOpen(false)} product={processOpen ? processProduct : null} />
    </>
  );
}
