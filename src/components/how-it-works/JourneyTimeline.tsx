import Image from "next/image";
import type { JourneyStep } from "@/types/content";

export function JourneyTimeline({ steps, start, ready }: { steps: JourneyStep[]; start: string; ready: string }) {
  return (
    <div className="relative mx-auto mt-14 max-w-[1000px]">
      <div className="absolute bottom-5 left-5 top-5 hidden w-px bg-[var(--accent)] md:block" />
      <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
        <span className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--foreground-on-light)]">⌑</span>{start}
      </div>
      <div className="space-y-4 md:pl-20">
        {steps.map((step) => (
          <article className="panel relative p-5 sm:p-6" key={step.number}>
            <div className="absolute -left-[76px] top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-[var(--accent)] bg-[var(--background)] md:grid">
              <Image alt="" aria-hidden height={20} src={step.icon} width={20} />
            </div>
            <div className="flex items-start gap-3">
              <span className="pt-0.5 text-xs font-bold text-[var(--accent)]">{step.number}</span>
              <div>
                <h2 className="text-base font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--label)]">{step.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--muted)]">
                  {step.points.map((point) => <span className="before:mr-2 before:text-[var(--accent)] before:content-['•']" key={point}>{point}</span>)}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
        <span className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--foreground-on-light)]">›</span>{ready}
      </div>
    </div>
  );
}
