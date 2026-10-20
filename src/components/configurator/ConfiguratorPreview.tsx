import content from "@/content/design.json";
import { PlatePreview } from "@/components/order/PlatePreview";
import type { PlateConfiguration } from "@/types/order";

export function ConfiguratorPreview({ config, onChange }: { config: PlateConfiguration; onChange: (patch: Partial<PlateConfiguration>) => void }) {
  return (
    <section className="mt-7">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-4 sm:p-8"><span className="sr-only">Live plate preview</span><PlatePreview config={config} onLogoPositionChange={(logoPosition) => onChange({ logoPosition })} /></div>
      </div>
      <p className="mt-5 text-center text-xs text-[var(--muted)]">{config.useType === "road-legal" ? content.roadLegalPreviewNote : content.previewNote}</p>
      {config.useType === "show" ? <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-[var(--muted)]">{content.professionalReviewNote}</p> : null}
    </section>
  );
}
