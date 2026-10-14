import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { FaqAccordion } from "@/components/faqs/FaqAccordion";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageShell } from "@/components/layout/PageShell";
import content from "@/content/faqs.json";
import type { FaqItem } from "@/types/content";

export const metadata: Metadata = { title: content.breadcrumb };

export default function FaqsPage() {
  return (
    <PageShell>
      <section className="py-12 md:py-16">
        <div className="site-container">
          <Breadcrumb current={content.breadcrumb} />
          <header className="mx-auto mt-8 max-w-2xl text-center"><h1 className="page-heading">{content.title}</h1><p className="mt-3 text-base text-[var(--label)]">{content.body}</p></header>
          <div className="mt-10"><FaqAccordion items={content.items as FaqItem[]} /></div>
          <div className="panel mx-auto mt-8 max-w-[1000px] px-6 py-8 text-center">
            <h2 className="text-xl font-semibold">{content.supportTitle}</h2><p className="mt-2 text-sm text-[var(--label)]">{content.supportBody}</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <a className="primary-button gap-2" href="https://wa.me/447438773936"><MessageCircle aria-hidden size={18} />{content.whatsapp}</a>
              <a className="secondary-button gap-2" href="mailto:info@lpworkshop.co.uk"><Mail aria-hidden size={18} />{content.email}</a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
