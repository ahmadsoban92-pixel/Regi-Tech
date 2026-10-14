"use client";

import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/types/content";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="panel mx-auto max-w-[1000px] overflow-hidden">
      {items.map((item) => (
        <details className="group border-b border-[var(--line)] last:border-b-0" key={item.question}>
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-sm font-semibold sm:px-6">
            {item.question}
            <ChevronDown aria-hidden className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" size={16} />
          </summary>
          <p className="px-5 pb-5 pr-12 text-sm leading-6 text-[var(--label)] sm:px-6 sm:pr-16">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
