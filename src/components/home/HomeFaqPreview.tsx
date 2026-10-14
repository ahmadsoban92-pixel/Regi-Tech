import Link from "next/link";
import { ChevronDown } from "lucide-react";
import content from "@/content/home.json";

export function HomeFaqPreview() {
  return (
    <section className="py-16 md:py-20">
      <div className="site-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div><h2 className="section-heading">{content.faqTitle}</h2><p className="mt-4 text-base leading-7 text-[var(--label)]">{content.faqBody}</p><Link className="primary-button mt-7" href="/faqs">{content.faqCta}</Link></div>
        <div className="panel overflow-hidden">
          {content.faqQuestions.map((question) => <Link className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4 text-sm font-medium last:border-0 hover:bg-[var(--surface-hover)]" href="/faqs" key={question}>{question}<ChevronDown aria-hidden className="shrink-0 text-[var(--muted)]" size={16} /></Link>)}
        </div>
      </div>
    </section>
  );
}
