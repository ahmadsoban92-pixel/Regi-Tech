import { formatPrice, getOrderTotal, getPriceBreakdown } from "@/lib/orderPricing";
import type { PlateConfiguration } from "@/types/order";

export function PriceSummary({ config, compact = false, quantity = 1 }: { config: PlateConfiguration; compact?: boolean; quantity?: number }) {
  const lines = getPriceBreakdown(config);
  const total = getOrderTotal(config) * quantity;

  return (
    <aside className="panel p-5">
      <h2 className="text-sm font-semibold">Price summary</h2>
      <dl className={`${compact ? "mt-3" : "mt-4"} space-y-2 text-xs text-[var(--muted)] sm:text-sm`}>
        {lines.map((line) => (
          <div className="flex items-start justify-between gap-4" key={line.label}>
            <dt>{line.label}</dt>
            <dd className="shrink-0 text-[var(--foreground)]">{formatPrice(line.amount * quantity)}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
          <dt>UK Royal Mail Tracked 48</dt>
          <dd className="rounded bg-[var(--accent)] px-1.5 py-0.5 text-[0.65rem] font-bold text-[var(--foreground-on-light)]">FREE</dd>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--line)] pt-2 font-bold text-[var(--foreground)]">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>
    </aside>
  );
}
