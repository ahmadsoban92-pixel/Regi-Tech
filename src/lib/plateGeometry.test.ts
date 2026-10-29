import { describe, expect, it } from "vitest";
import { getPlateGeometry } from "@/lib/plateGeometry";
import { createDefaultConfiguration } from "@/lib/productCatalog";
import type { PlateSize } from "@/types/order";

describe("plate geometry", () => {
  it.each([
    ["3×7″", 7 / 3, true],
    ["4×6″", 6 / 4, false],
    ["5×7″", 7 / 5, false],
    ["6×8″", 8 / 6, false],
    ["7×9″", 9 / 7, false],
  ] as const)("uses the physical ratio for %s", (size, ratio, singleLine) => {
    const config = { ...createDefaultConfiguration("hand-crafted-show-plate"), size };
    const geometry = getPlateGeometry(config);
    expect(geometry.aspectRatio).toBeCloseTo(ratio);
    expect(geometry.registration.singleLine).toBe(singleLine);
    expect(geometry.cornerRadiusCqw).toBeGreaterThan(2);
    if (singleLine) expect(geometry.registration.logoSingleRowTopPercent).toBeGreaterThan(geometry.registration.singleRowTopPercent);
    else expect(geometry.registration.logoFirstRowTopPercent).toBeGreaterThan(geometry.registration.firstRowTopPercent);
  });

  it("derives custom geometry from entered dimensions", () => {
    const config = {
      ...createDefaultConfiguration("hand-crafted-show-plate"),
      size: "Custom" as PlateSize,
      customWidth: "21",
      customHeight: "9",
    };
    const geometry = getPlateGeometry(config);
    expect(geometry.aspectRatio).toBeCloseTo(21 / 9);
    expect(geometry.registration.singleLine).toBe(true);
  });

  it.each([
    ["4×6″", 102, 41, 3.6],
    ["5×7″", 127, 50, 7],
    ["6×8″", 153, 56, 10],
    ["7×9″", 178, 64, 11],
  ] as const)("uses the client measurement guide as a balanced cap for %s", (size, plateHeightMm, characterHeightMm, rowGapMm) => {
    const config = { ...createDefaultConfiguration(size === "7×9″" ? "2d-road-legal" : "hand-crafted-show-plate"), size };
    const registration = getPlateGeometry(config).registration;
    const estimatedGlyphHeightMm = registration.maxFontSizeCqw / 100 * (plateHeightMm * getPlateGeometry(config).aspectRatio) * 0.69;
    const rowAdvanceMm = (registration.secondRowTopPercent - registration.firstRowTopPercent) / 100 * plateHeightMm;
    expect(Math.abs(estimatedGlyphHeightMm - characterHeightMm)).toBeLessThan(1);
    expect(Math.abs(rowAdvanceMm - characterHeightMm - rowGapMm)).toBeLessThan(3);
  });

  it("gives 3×7 a tall, narrow lettering cap for measured fitting", () => {
    const config = { ...createDefaultConfiguration("hand-crafted-show-plate"), size: "3×7″" as PlateSize };
    const registration = getPlateGeometry(config).registration;
    expect(registration.maxFontSizeCqw / 100 * 178 * 0.69).toBeCloseTo(50, 0);
    expect(registration.horizontalScale).toBeLessThan(1);
    expect(registration.singleLine).toBe(true);
  });
});
