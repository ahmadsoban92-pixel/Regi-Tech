import { ButtonLink } from "@/components/ui/ButtonLink";
import content from "@/content/home.json";

export function HomeClosingSection() {
  return (
    <section className="border-t border-[var(--line)] bg-[var(--background-deep)] py-16 text-center md:py-20">
      <div className="site-container"><h2 className="section-heading">{content.closingTitle}</h2><p className="mt-4 text-[var(--label)]">{content.closingBody}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href="/design?new=1">{content.closingPrimary}</ButtonLink><ButtonLink href="/our-plates" variant="secondary">{content.closingSecondary}</ButtonLink></div></div>
    </section>
  );
}
