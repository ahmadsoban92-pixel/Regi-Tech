import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import shared from "@/content/shared.json";

const hrefs: Record<string, string> = {
  "Our Plates": "/our-plates",
  "How to Order": "/how-it-works",
  "Show vs Road-Legal": "/information/road-legal-vs-show",
  FAQs: "/faqs",
  Contact: "/contact",
  "Delivery Information": "/information/delivery",
  "Terms & Conditions": "/information/terms",
  "Cancellations & Refunds": "/information/cancellations-and-refunds",
  "24-Month Warranty": "/information/warranty",
  "Privacy Policy": "/information/privacy"
};

function FooterLinks({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      <ul className="space-y-2 text-sm text-[var(--muted)]">
        {items.map((item) => (
          <li key={item}>
            <Link className="transition-colors hover:text-[var(--foreground)]" href={hrefs[item] ?? "/"}>{item}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const footer = shared.footer;
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--background)]">
      <div className="site-container grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
        <div>
          <Image alt="Regi-Tech" className="h-auto w-[230px] max-w-full object-contain" height={135} src="/assets/regitech/logo.png" width={270} />
          <p className="mt-5 max-w-[270px] text-sm leading-6 text-[var(--muted)]">{footer.description}</p>
          <p className="mt-2 max-w-[270px] text-sm leading-6 text-[var(--muted)]">{footer.operator}</p>
        </div>
        <FooterLinks items={footer.products} title="Products" />
        <div className="space-y-8">
          <FooterLinks items={footer.help} title="Help" />
          <FooterLinks items={footer.policies} title="Policies" />
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Contact</h2>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <a className="flex items-center gap-2 hover:text-[var(--foreground)]" href={`mailto:${footer.email}`}><Mail aria-hidden size={16} />{footer.email}</a>
            <a aria-label="Chat with Regi-Tech on WhatsApp" className="primary-button mt-5 w-fit gap-2 px-4 text-xs" href={shared.whatsappHref}><MessageCircle aria-hidden size={16} />{shared.whatsapp}</a>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)] py-5 text-center text-xs text-[var(--faint)]">{footer.copyright}</div>
    </footer>
  );
}
