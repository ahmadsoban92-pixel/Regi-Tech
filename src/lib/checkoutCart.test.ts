import { describe, expect, it } from "vitest";
import { matchingCheckoutItemIds } from "@/lib/checkoutCart";
import { createDefaultConfiguration } from "@/lib/productCatalog";
import type { CartItem } from "@/types/order";

const purchased: CartItem = {
  id: "purchased",
  quantity: 1,
  config: { ...createDefaultConfiguration("hand-crafted-show-plate"), registration: "AB76 BCD" },
};

describe("completed checkout cart lines", () => {
  it("removes only the purchased lines and ignores temporary artwork preview URLs", () => {
    const unrelated = { ...purchased, id: "new-design" };
    const returned = { ...purchased, config: { ...purchased.config, uploadedLogoPreviewUrl: "" } };
    const submitted = { ...purchased, config: { ...purchased.config, uploadedLogoPreviewUrl: "blob:preview" } };
    expect(matchingCheckoutItemIds([returned, unrelated], [submitted])).toEqual(["purchased"]);
  });

  it("preserves a line edited while payment was in progress", () => {
    const edited = { ...purchased, config: { ...purchased.config, registration: "XY12 ZZZ" } };
    expect(matchingCheckoutItemIds([edited], [purchased])).toEqual([]);
  });
});
