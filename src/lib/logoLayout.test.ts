import { describe, expect, it } from "vitest";
import { clampLogoPosition, fitLogoVisualSize, getDefaultLogoPosition, getLogoAspectRatio, scaleLogoVisualSize } from "@/lib/logoLayout";
import { getPlateGeometry } from "@/lib/plateGeometry";
import { createDefaultConfiguration, getLogoDefinition } from "@/lib/productCatalog";

describe("logo layout", () => {
  it("uses the visible artwork ratio instead of the padded source canvas", () => {
    const config = { ...createDefaultConfiguration("hand-crafted-show-plate"), logo: "Triumph" as const };
    const geometry = getPlateGeometry(config);
    const size = fitLogoVisualSize(geometry, getLogoAspectRatio(config));

    expect(getLogoAspectRatio(config)).toBeCloseTo(148 / 41);
    expect(size.widthPercent).toBe(20);
    expect(size.heightPercent).toBeLessThan(9);
  });

  it("allows tight artwork to reach the safe plate edges", () => {
    const config = { ...createDefaultConfiguration("hand-crafted-show-plate"), logo: "BMW" as const };
    const geometry = getPlateGeometry(config);
    const size = fitLogoVisualSize(geometry, getLogoAspectRatio(config));
    const left = clampLogoPosition({ x: -100, y: 50 }, config, geometry, size);
    const right = clampLogoPosition({ x: 200, y: 50 }, config, geometry, size);

    expect(left.x).toBeLessThan(10);
    expect(right.x).toBeGreaterThan(90);
  });

  it("places newly selected artwork in the reserved top-centre zone", () => {
    const config = { ...createDefaultConfiguration("hand-crafted-show-plate"), logo: "Kawasaki" as const };
    const position = getDefaultLogoPosition(config);
    expect(position.x).toBe(50);
    expect(position.y).toBeGreaterThan(0);
    expect(position.y).toBeLessThan(15);
  });

  it.each(["Honda", "Harley-Davidson"] as const)("reduces %s artwork and uses the smaller drag bounds", (logo) => {
    const config = { ...createDefaultConfiguration("hand-crafted-show-plate"), logo };
    const geometry = getPlateGeometry(config);
    const original = fitLogoVisualSize(geometry, getLogoAspectRatio(config));
    const reduced = scaleLogoVisualSize(original, getLogoDefinition(logo)?.scale);
    expect(reduced.widthPercent).toBeCloseTo(original.widthPercent * 0.85);
    expect(reduced.heightPercent).toBeCloseTo(original.heightPercent * 0.85);
    expect(clampLogoPosition({ x: -100, y: 50 }, config, geometry, reduced).x)
      .toBeLessThan(clampLogoPosition({ x: -100, y: 50 }, config, geometry, original).x);
  });

  it.each(["black-4d", "crystal-3d", "2d-show-plate"] as const)("keeps KTM clear of the registration on %s", (productId) => {
    const config = { ...createDefaultConfiguration(productId, "AS32NNN"), logo: "KTM" as const, size: "4×6″" as const };
    const geometry = getPlateGeometry(config);
    const fullSize = fitLogoVisualSize(geometry, getLogoAspectRatio(config));
    const logoSize = scaleLogoVisualSize(fullSize, getLogoDefinition("KTM")?.scale);

    expect(logoSize.widthPercent).toBeLessThanOrEqual(12);
    expect(logoSize.heightPercent).toBeLessThanOrEqual(8);
  });
});
