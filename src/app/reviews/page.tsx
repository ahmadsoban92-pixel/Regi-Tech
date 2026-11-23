import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageShell } from "@/components/layout/PageShell";
import content from "@/content/reviews.json";

export const metadata: Metadata = {
  title: "Leave a Review",
  description: "Share your honest experience with Regi-Tech on Google or Trustpilot.",
};

export default function ReviewsPage() {
  return (
    <PageShell>
      <section className="site-container py-12 md:py-16">
        <Breadcrumb current="Reviews" />
        <header className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Your experience matters</p>
          <h1 className="page-heading mt-4">{content.title}</h1>
          <p className="mt-5 text-base leading-7 text-[var(--label)]">{content.body}</p>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{content.instruction}</p>
        </header>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          {content.platforms.map((platform) => (
            <article className="panel motion-card flex flex-col items-center p-6 text-center sm:p-8" key={platform.name}>
              <h2 className="text-xl font-bold text-[var(--foreground)]">{platform.name}</h2>
              <a aria-label={`Open ${platform.name} to leave a review`} className="mt-6 block w-full max-w-[280px] rounded-lg bg-white p-3 transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]" href={platform.href} rel="noopener noreferrer" target="_blank">
                <Image alt={`QR code for leaving a ${platform.name} review`} className="aspect-square h-auto w-full" height={675} sizes="(max-width: 640px) 75vw, 280px" src={platform.image} unoptimized width={675} />
              </a>
              <a className="primary-button mt-6 w-full max-w-[280px] gap-2" href={platform.href} rel="noopener noreferrer" target="_blank">{platform.button}<ArrowUpRight aria-hidden size={18} /></a>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
