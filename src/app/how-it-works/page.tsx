import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageShell } from "@/components/layout/PageShell";
import { JourneyTimeline } from "@/components/how-it-works/JourneyTimeline";
import { ButtonLink } from "@/components/ui/ButtonLink";
import content from "@/content/how-it-works.json";
import type { JourneyStep } from "@/types/content";

export const metadata: Metadata = { title: content.breadcrumb };

export default function HowItWorksPage() {
  return (
    <PageShell>
      <section className="py-12 md:py-16">
        <div className="site-container">
          <Breadcrumb current={content.breadcrumb} />
          <header className="mx-auto mt-10 max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-[var(--accent-border)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-[var(--accent)]">{content.eyebrow}</span>
            <h1 className="page-heading mt-5">{content.title}</h1>
            <p className="mt-4 text-base text-[var(--label)]">{content.body}</p>
          </header>
          <JourneyTimeline ready={content.ready} start={content.start} steps={content.steps as JourneyStep[]} />
          <div className="mt-14 text-center"><ButtonLink className="min-w-[250px]" href="/our-plates">{content.cta}</ButtonLink><p className="mt-3 text-xs text-[var(--muted)]">{content.ctaNote}</p></div>
        </div>
      </section>
    </PageShell>
  );
}
