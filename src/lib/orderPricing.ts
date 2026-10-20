import { FIXING_OPTIONS, getCountryFlagDefinition, getProductRule, OPTION_PRICES } from "@/lib/productCatalog";
import type { CartItem, PlateConfiguration, PriceLine } from "@/types/order";

export function getPriceBreakdown(config: PlateConfiguration): PriceLine[] {
  const rule = getProductRule(config.productId);
  const lines: PriceLine[] = [{ label: `${config.productName} — base price`, amount: rule.basePrice }];
  const sizePrice = rule.sizes.includes(config.size) ? OPTION_PRICES.sizes[config.size] ?? 0 : 0;
  const innerPrice = rule.innerBorders.includes(config.innerBorder) ? OPTION_PRICES.borders[config.innerBorder] ?? 0 : 0;
  const outerPrice = rule.outerBorders.includes(config.outerBorder) ? OPTION_PRICES.borders[config.outerBorder] ?? 0 : 0;
  const logoPrice = rule.logos.includes(config.logo) ? OPTION_PRICES.logos[config.logo] ?? 0 : 0;
  const flagPrice = rule.countryFlags.includes(config.countryFlag) ? OPTION_PRICES.countryFlags[config.countryFlag] ?? 0 : 0;
  const fixingPrice = rule.fixings.includes(config.fixing) ? OPTION_PRICES.fixings[config.fixing] ?? 0 : 0;

  if (sizePrice) lines.push({ label: `${config.size} custom size`, amount: sizePrice });
  if (innerPrice) lines.push({ label: `${config.innerBorder} inner border`, amount: innerPrice });
  if (outerPrice) lines.push({ label: `${config.outerBorder} outer border`, amount: outerPrice });
  if (logoPrice) lines.push({ label: config.logo, amount: logoPrice });
  if (rule.slogan && config.sloganMode === "custom") lines.push({ label: "Slogan", amount: OPTION_PRICES.slogan });
  if (flagPrice) lines.push({ label: getCountryFlagDefinition(config.countryFlag).label, amount: flagPrice });
  if (fixingPrice) lines.push({ label: FIXING_OPTIONS[config.fixing].label, amount: fixingPrice });

  return lines;
}

export function getOrderTotal(config: PlateConfiguration): number {
  return getPriceBreakdown(config).reduce((total, line) => total + line.amount, 0);
}

export function getOrderTotalPence(config: PlateConfiguration): number {
  return getPriceBreakdown(config).reduce((total, line) => total + Math.round(line.amount * 100), 0);
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + getOrderTotal(item.config) * item.quantity, 0);
}

export function getCartTotalPence(items: CartItem[]): number {
  return items.reduce((total, item) => total + getOrderTotalPence(item.config) * item.quantity, 0);
}

export function getCartQuantity(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function formatPrice(value: number): string {
  return `£${value.toFixed(2)}`;
}
