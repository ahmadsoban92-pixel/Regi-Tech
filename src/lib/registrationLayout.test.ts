import { describe, expect, it } from "vitest";
import { createDefaultConfiguration } from "@/lib/productCatalog";
import { getPlateGeometry } from "@/lib/plateGeometry";
import { fitRegistrationLayout } from "@/lib/registrationLayout";

const geometry = getPlateGeometry({ ...createDefaultConfiguration("hand-crafted-show-plate"), size: "6×8″" });
const first = { width: 220, ascent: 70, descent: 0 };
const second = { width: 170, ascent: 70, descent: 0 };
const input = { geometry, first, second, maxFontSize: geometry.registration.maxFontSizeCqw, horizontalScale: geometry.registration.horizontalScale, frameInset: 4.2, hasFlag: false, roadLegal: false };

describe("measured registration layout", () => {
  it("centres visible stacked lettering within the printable height", () => {
    const layout = fitRegistrationLayout(input);
    const topMargin = layout.top - 6.1;
    const bottomMargin = 100 / geometry.aspectRatio - 6.1 - layout.bottom;
    expect(topMargin).toBeCloseTo(bottomMargin, 5);
    expect(layout.fontSize).toBeCloseTo(40, 5);
  });

  it("reserves only the top area occupied by the logo", () => {
    const normal = fitRegistrationLayout(input);
    const occupied = fitRegistrationLayout({ ...input, logoBounds: { left: 45, right: 55, top: 4, bottom: 13 } });
    const movedAway = fitRegistrationLayout({ ...input, logoBounds: { left: 45, right: 55, top: 30, bottom: 38 } });
    expect(occupied.top).toBeGreaterThan(normal.top);
    expect(movedAway.top).toBeCloseTo(normal.top, 5);
    expect(occupied.fontSize).toBeLessThan(normal.fontSize);
    expect(occupied.horizontalScale).toBeGreaterThan(normal.horizontalScale);
    expect(occupied.fontSize * occupied.horizontalScale).toBeCloseTo(normal.fontSize * normal.horizontalScale, 5);
  });

  it("moves lettering up for a slogan without reducing width when it fits", () => {
    const normal = fitRegistrationLayout(input);
    const withSlogan = fitRegistrationLayout({ ...input, sloganTop: 70 });
    expect(withSlogan.top).toBeLessThan(normal.top);
    expect(withSlogan.bottom).toBeLessThan(70);
    expect(withSlogan.fontSize).toBeCloseTo(normal.fontSize, 5);
  });
});
