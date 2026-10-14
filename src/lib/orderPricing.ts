import designContent from "@/content/design.json";
import type { PlateConfiguration, PriceLine } from "@/types/order";

function findPrice(options: Array<{ value: string; price: number }>, value: string): number {
  return options.find((option) => option.value === value)?.price ?? 0;
}

export function getPriceBreakdown(config: PlateConfiguration): PriceLine[] {
  const lines: PriceLine[] = [{ label: `${config.productName} — base price`, amount: config.basePrice }];
  const sizePrice = findPrice(designContent.size.options, config.size);
  const innerPrice = findPrice(designContent.borders.options, config.innerBorder);
  const outerPrice = findPrice(designContent.borders.options, config.outerBorder);
  const logoPrice = findPrice(designContent.logo.options, config.logo);
  const fixingPrice = findPrice(designContent.fixings.options, config.fixing);

  if (sizePrice) lines.push({ label: `${config.size} custom size`, amount: sizePrice });
  if (innerPrice) lines.push({ label: `${config.innerBorder} inner border`, amount: innerPrice });
  if (outerPrice) lines.push({ label: `${config.outerBorder} outer border`, amount: outerPrice });
  if (logoPrice) lines.push({ label: config.logo, amount: logoPrice });
  if (config.sloganEnabled) lines.push({ label: "Slogan", amount: designContent.slogan.price });
  if (fixingPrice) lines.push({ label: config.fixing, amount: fixingPrice });

  return lines;
}

export function getOrderTotal(config: PlateConfiguration): number {
  return getPriceBreakdown(config).reduce((total, line) => total + line.amount, 0);
}

export function formatPrice(value: number): string {
  return `£${value.toFixed(2)}`;
}
