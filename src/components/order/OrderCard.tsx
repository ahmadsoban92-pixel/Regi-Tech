import Link from "next/link";
import { Pencil } from "lucide-react";
import { PlatePreview } from "@/components/order/PlatePreview";
import { formatPrice, getOrderTotal, getPriceBreakdown } from "@/lib/orderPricing";
import type { PlateConfiguration } from "@/types/order";
import { getProductRule } from "@/lib/productCatalog";

export function OrderCard({ config, editable = false, quantity = 1 }: { config: PlateConfiguration; editable?: boolean; quantity?: number }) {
  const rule = getProductRule(config.productId);
  const details = [
    config.size === "Custom" ? `Custom: ${config.customWidth}×${config.customHeight}″` : config.size,
    rule.innerBorders.length > 1 ? `${config.innerBorder} inner border` : "",
    rule.outerBorders.length > 1 ? `${config.outerBorder} outer border` : "",
    rule.logos.length > 1 ? (config.logo === "Other Logo" ? config.uploadedLogoName || config.logo : config.logo) : "",
    config.countryFlag !== "None" ? `${config.countryFlag} country flag` : "",
    rule.slogan ? (config.sloganMode === "custom" ? `Slogan “${config.sloganText}” (${config.sloganFont})` : "No slogan") : "",
    config.fixing,
  ].filter(Boolean);
  const lines = getPriceBreakdown(config);

  return (
    <article className="panel p-4 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
        <div className="grid min-h-56 place-items-center rounded-md border border-[var(--line)] bg-[var(--background-deep)] p-5"><PlatePreview compact config={config} /></div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{config.productName}</h2><p className="mt-1 font-mono text-sm">{config.registration || "YOUR REJ"}{quantity > 1 ? ` · × ${quantity}` : ""}</p></div>{editable ? <Link className="secondary-button min-h-8 gap-1 px-3 py-1 text-xs" href="/design"><Pencil aria-hidden size={14} />Edit</Link> : null}</div>
          <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">{details.map((detail) => <li key={detail}>• {detail}</li>)}</ul>
          {config.specialRequirements ? <p className="mt-3 text-sm text-[var(--muted)]">Special requirements: {config.specialRequirements}</p> : null}
          {config.orderNotes ? <p className="mt-2 text-sm text-[var(--muted)]">Order notes: {config.orderNotes}</p> : null}
          <div className="mt-5 border-t border-[var(--line)] pt-4"><h3 className="text-sm font-semibold">Price breakdown</h3><dl className="mt-3 space-y-2 text-sm text-[var(--muted)]">{lines.map((line) => <div className="flex justify-between gap-4" key={line.label}><dt>{line.label}</dt><dd>{formatPrice(line.amount * quantity)}</dd></div>)}<div className="flex justify-between border-t border-[var(--line)] pt-2 font-bold text-[var(--foreground)]"><dt>Item total</dt><dd>{formatPrice(getOrderTotal(config) * quantity)}</dd></div></dl></div>
        </div>
      </div>
    </article>
  );
}
