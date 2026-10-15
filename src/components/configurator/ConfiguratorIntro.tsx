import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import content from "@/content/design.json";
import type { ConfiguratorStepKey, PlateConfiguration } from "@/types/order";

export function ConfiguratorIntro({ config, steps, stepIndex, onStepChange }: { config: PlateConfiguration; steps: ConfiguratorStepKey[]; stepIndex: number; onStepChange: (stepIndex: number) => void }) {
  return (
    <>
      <Breadcrumb current={config.productName} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3"><h1 className="page-heading">{config.productName}</h1><span className="rounded bg-[var(--surface)] px-2 py-1 text-xs text-[var(--label)]">{config.badge}</span></div>
        <Link className="secondary-button min-h-8 py-1 text-xs" href="/our-plates">{content.changeStyle}</Link>
      </div>
      <div aria-label="Configuration steps" className="hide-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
        {steps.map((stepKey, index) => {
          const number = index + 1;
          const label = content.stepLabels[stepKey];
          return <button aria-current={stepIndex === index ? "step" : undefined} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs ${stepIndex === index ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--foreground-on-light)]" : "border-[var(--line-strong)] text-[var(--muted)]"}`} key={stepKey} onClick={() => onStepChange(index)} type="button"><span>{number}</span>{label}</button>;
        })}
      </div>
    </>
  );
}
