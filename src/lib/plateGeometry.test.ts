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
});
