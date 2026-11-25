import type { CartItem } from "@/types/order";

export function matchingCheckoutItemIds(currentItems: CartItem[], checkoutItems: CartItem[]): string[] {
  const submitted = new Map(checkoutItems.map((item) => [item.id, item]));
  return currentItems.filter((item) => {
    const original = submitted.get(item.id);
    if (!original || original.quantity !== item.quantity) return false;
    const currentConfig = { ...item.config, uploadedLogoPreviewUrl: "" };
    const originalConfig = { ...original.config, uploadedLogoPreviewUrl: "" };
    return JSON.stringify(currentConfig) === JSON.stringify(originalConfig);
  }).map((item) => item.id);
}
