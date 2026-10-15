import content from "@/content/design.json";
import { PlatePreview } from "@/components/order/PlatePreview";
import type { PlateConfiguration } from "@/types/order";

export function ConfiguratorPreview({ config, onChange }: { config: PlateConfiguration; onChange: (patch: Partial<PlateConfiguration>) => void }) {
  const previews = config.useType === "road-legal" ? [{ label: "Road-legal rear", side: "rear" as const }] : [{ label: "Front", side: "front" as const }, { label: "Rear", side: "rear" as const }];
  return (
    <section className="mt-7">
      <div className={`grid gap-4 ${previews.length > 1 ? "md:grid-cols-2" : "mx-auto max-w-3xl"}`}>
        {previews.map((preview) => <div className="rounded-lg border border-[var(--line)] bg-[var(--background-deep)] p-4 sm:p-8" key={preview.label}><span className="sr-only">{preview.label} plate preview</span><PlatePreview config={config} onLogoPositionChange={(logoPosition) => onChange({ logoPosition })} side={preview.side} /></div>)}
      </div>
      <p className="mt-5 text-center text-xs text-[var(--muted)]">{config.useType === "road-legal" ? content.roadLegalPreviewNote : content.previewNote}</p>
    </section>
  );
}
