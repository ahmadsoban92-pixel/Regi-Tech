"use client";

import { ChevronDown } from "lucide-react";
import type { FaqItem, FaqTextPart } from "@/types/content";

function TextParts({ parts }: { parts: FaqTextPart[] }) {
  return parts.map((part, index) => part.strong ? <strong key={`${part.text}-${index}`}>{part.text}</strong> : <span key={`${part.text}-${index}`}>{part.text}</span>);
}

function FaqAnswer({ answer }: { answer: FaqItem["answer"] }) {
  if (typeof answer === "string") return <p className="text-sm leading-6 text-[var(--label)]">{answer}</p>;

  return (
    <div className="space-y-4 text-sm leading-6 text-[var(--label)]">
      {answer.map((block, index) => {
        if (block.type === "heading") return <h3 className="pt-1 font-semibold text-[var(--foreground)]" key={`${block.text}-${index}`}>{block.text}</h3>;
        if (block.type === "list") return <ul className="list-disc space-y-2 pl-5" key={`list-${index}`}>{block.items.map((item, itemIndex) => <li key={itemIndex}><TextParts parts={item.parts} /></li>)}</ul>;
        return <p key={`paragraph-${index}`}>{block.parts ? <TextParts parts={block.parts} /> : block.text}</p>;
      })}
    </div>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="panel mx-auto max-w-[1000px] overflow-hidden">
      {items.map((item) => (
        <details className="group border-b border-[var(--line)] last:border-b-0" key={item.question}>
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-sm font-semibold sm:px-6">
            {item.question}
            <ChevronDown aria-hidden className="shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" size={16} />
          </summary>
          <div className="px-5 pb-6 pr-8 sm:px-6 sm:pr-16"><FaqAnswer answer={item.answer} /></div>
        </details>
      ))}
    </div>
  );
}
