import content from "@/content/home.json";
import { Reveal } from "@/components/ui/Reveal";

export function HomeJourneySection() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--background-deep)] py-16 md:py-20">
      <div className="site-container">
        <p className="eyebrow">{content.stepsEyebrow}</p>
        <h2 className="section-heading mt-3">{content.stepsTitle}</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {content.steps.map((step, index) => (
            <Reveal delay={index * 0.08} key={step.number}>
              <div className="grid size-10 place-items-center rounded-full border border-[var(--accent)] text-xs font-bold text-[var(--accent)]">{step.number}</div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
