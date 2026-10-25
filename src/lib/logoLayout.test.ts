import { describe, expect, it } from "vitest";
import { clampLogoPosition, fitLogoVisualSize, getDefaultLogoPosition, getLogoAspectRatio } from "@/lib/logoLayout";
import { getPlateGeometry } from "@/lib/plateGeometry";
import { createDefaultConfiguration } from "@/lib/productCatalog";

describe("logo layout", () => {
  it("uses the visible artwork ratio instead of the padded source canvas", () => {
    const config = { ...createDefaultConfiguration("hand-crafted-show-plate"), logo: "Triumph" as const };
    const geometry = getPlateGeometry(config);
    const size = fitLogoVisualSize(geometry, getLogoAspectRatio(config));

    expect(getLogoAspectRatio(config)).toBeCloseTo(148 / 41);
    expect(size.widthPercent).toBe(22);
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
});
