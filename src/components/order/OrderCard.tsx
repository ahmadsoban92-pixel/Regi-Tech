import Link from "next/link";
import { Pencil } from "lucide-react";
import { PlatePreview } from "@/components/order/PlatePreview";
import { formatPrice, getOrderTotal, getPriceBreakdown } from "@/lib/orderPricing";
import type { PlateConfiguration, PriceLine } from "@/types/order";
import { FIXING_OPTIONS, formatPlateSize, getCountryFlagDefinition, getProductRule } from "@/lib/productCatalog";

type OrderCardProps = {
  config: PlateConfiguration;
  editable?: boolean;
  persistedPriceBreakdown?: PriceLine[];
  persistedTotalPence?: number;
  quantity?: number;
  editHref?: string;
  onEdit?: () => void;
};

export function OrderCard({ config, editable = false, editHref = "/design", onEdit, persistedPriceBreakdown, persistedTotalPence, quantity = 1 }: OrderCardProps) {
  const rule = getProductRule(config.productId);
  const details = [
    formatPlateSize(config),
    rule.innerBorders.length > 1 ? `${config.innerBorder} inner border` : "",
    rule.outerBorders.length > 1 ? `${config.outerBorder} outer border` : "",
    rule.logos.length > 1 ? (config.logo === "Other Logo" ? config.uploadedLogoName || config.logo : config.logo) : "",
    config.countryFlag !== "none" ? getCountryFlagDefinition(config.countryFlag).label : "",
    rule.slogan ? (config.sloganMode === "custom" ? `Slogan “${config.sloganText}” (${config.sloganFont})` : "No slogan") : "",
    FIXING_OPTIONS[config.fixing].label,
  ].filter(Boolean);
  const lines = persistedPriceBreakdown ?? getPriceBreakdown(config);
  const total = persistedTotalPence === undefined ? getOrderTotal(config) * quantity : persistedTotalPence / 100;

  return (
    <article className="panel p-4 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
        <div className="grid min-h-56 place-items-center rounded-md border border-[var(--line)] bg-[var(--background-deep)] p-5"><PlatePreview compact config={config} /></div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{config.productName}</h2><p className="mt-1 font-mono text-sm">{config.registration || "YOUR REJ"}{quantity > 1 ? ` · × ${quantity}` : ""}</p></div>{editable ? <Link className="secondary-button min-h-8 gap-1 px-3 py-1 text-xs" href={editHref} onClick={onEdit}><Pencil aria-hidden size={14} />Edit</Link> : null}</div>
          <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">{details.map((detail) => <li key={detail}>• {detail}</li>)}</ul>
          {config.specialRequirements ? <p className="mt-3 text-sm text-[var(--muted)]">Special requirements: {config.specialRequirements}</p> : null}
          <div className="mt-5 border-t border-[var(--line)] pt-4"><h3 className="text-sm font-semibold">Price breakdown</h3><dl className="mt-3 space-y-2 text-sm text-[var(--muted)]">{lines.map((line) => <div className="flex justify-between gap-4" key={line.label}><dt>{line.label}</dt><dd>{formatPrice(line.amount * quantity)}</dd></div>)}<div className="flex justify-between border-t border-[var(--line)] pt-2 font-bold text-[var(--foreground)]"><dt>Item total</dt><dd>{formatPrice(total)}</dd></div></dl></div>
        </div>
      </div>
    </article>
  );
}
