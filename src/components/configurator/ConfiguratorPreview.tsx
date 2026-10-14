import content from "@/content/design.json";
import { PlatePreview } from "@/components/order/PlatePreview";
import type { PlateConfiguration } from "@/types/order";

export function ConfiguratorPreview({ config }: { config: PlateConfiguration }) {
  return (
    <section className="mt-7">
      <div className="grid gap-4 md:grid-cols-2">
        {["Front", "Rear"].map((side) => <div className="rounded-lg border border-[var(--line)] bg-[var(--background-deep)] p-4 sm:p-8" key={side}><span className="sr-only">{side} plate preview</span><PlatePreview config={config} /></div>)}
      </div>
      <p className="mt-5 text-center text-xs text-[var(--muted)]">{content.previewNote}</p>
    </section>
  );
}
