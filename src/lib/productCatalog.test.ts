import { describe, expect, it } from "vitest";
import { createDefaultConfiguration, normalizePlateConfiguration } from "@/lib/productCatalog";

describe("product option normalization", () => {
  it("removes unsupported outer and silver borders from 2D products", () => {
    const show = normalizePlateConfiguration({
      ...createDefaultConfiguration("2d-show-plate"),
      innerBorder: "Mirror Silver",
      outerBorder: "Black",
    });
    const roadLegal = normalizePlateConfiguration({
      ...createDefaultConfiguration("2d-road-legal"),
      innerBorder: "Mirror Silver",
      outerBorder: "Mirror Silver",
    });

    expect(show.innerBorder).toBe("None");
    expect(show.outerBorder).toBe("None");
    expect(roadLegal.innerBorder).toBe("None");
    expect(roadLegal.outerBorder).toBe("None");
  });

  it("retains independent eligible border materials", () => {
    const config = normalizePlateConfiguration({
      ...createDefaultConfiguration("hand-crafted-show-plate"),
      innerBorder: "Black",
      outerBorder: "Mirror Silver",
    });
    expect(config.innerBorder).toBe("Black");
    expect(config.outerBorder).toBe("Mirror Silver");
  });

  it("retains the permitted black inner border on 2D products", () => {
    for (const productId of ["2d-show-plate", "2d-road-legal"] as const) {
      const config = normalizePlateConfiguration({
        ...createDefaultConfiguration(productId),
        innerBorder: "Black",
      });
      expect(config.innerBorder).toBe("Black");
      expect(config.outerBorder).toBe("None");
    }
  });

  it("keeps a border slogan only while an eligible inner border and slogan are selected", () => {
    const config = { ...createDefaultConfiguration("hand-crafted-show-plate"), innerBorder: "Black" as const, sloganMode: "custom" as const, sloganPlacement: "border" as const };
    expect(normalizePlateConfiguration(config).sloganPlacement).toBe("border");
    expect(normalizePlateConfiguration({ ...config, innerBorder: "None" }).sloganPlacement).toBe("plate");
    expect(normalizePlateConfiguration({ ...config, sloganMode: "none" }).sloganPlacement).toBe("plate");
  });
});
