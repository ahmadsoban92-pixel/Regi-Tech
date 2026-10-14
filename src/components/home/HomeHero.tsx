import { ButtonLink } from "@/components/ui/ButtonLink";
import content from "@/content/home.json";

export function HomeHero() {
  return (
    <section className="relative min-h-[620px] overflow-hidden md:min-h-[720px]">
      <div className="absolute inset-0 bg-[url('/assets/regitech/hero.png')] bg-cover bg-[65%_center] md:bg-center" />
      <div className="hero-overlay absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,var(--background))]" />
      <div className="site-container relative flex min-h-[620px] items-center py-20 md:min-h-[720px] md:py-24">
        <div className="max-w-[620px] pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--label)] sm:text-sm">{content.eyebrow}</p>
          <h1 className="mt-4 text-[clamp(3.3rem,9vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">
            {content.titleLine1}<br />{content.titleLine2.slice(0, -1)}<span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="mt-6 max-w-[500px] text-base leading-7 text-[var(--label)] sm:text-lg">{content.heroBody}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink className="min-h-12 px-8" href="/design">{content.heroPrimary}</ButtonLink>
            <ButtonLink className="min-h-12 px-8" href="/our-plates" variant="secondary">{content.heroSecondary}</ButtonLink>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--label)]">
            {content.proofPoints.map((point, index) => (
              <span className="flex items-center gap-4" key={point}>{index > 0 ? <span className="text-[var(--accent)]">•</span> : null}{point}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
