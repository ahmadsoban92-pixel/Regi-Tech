import type { Metadata } from "next";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { ContactForm } from "@/components/contact/ContactForm";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageShell } from "@/components/layout/PageShell";
import content from "@/content/contact.json";

export const metadata: Metadata = { title: content.breadcrumb };

export default function ContactPage() {
  return (
    <PageShell>
      <section className="py-12 md:py-16">
        <div className="site-container">
          <Breadcrumb current={content.breadcrumb} />
          <header className="mt-6 max-w-2xl"><h1 className="page-heading">{content.title}</h1><p className="mt-3 max-w-xl text-base leading-7 text-[var(--label)]">{content.body}</p></header>
          <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-10"><ContactDetails /><ContactForm /></div>
        </div>
      </section>
    </PageShell>
  );
}
