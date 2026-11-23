import { describe, expect, it } from "vitest";
import { createDefaultConfiguration } from "@/lib/productCatalog";
import { getPlateGeometry } from "@/lib/plateGeometry";
import { fitFlagPlacement, fitRegistrationLayout, splitRegistration } from "@/lib/registrationLayout";

const geometry = getPlateGeometry({ ...createDefaultConfiguration("hand-crafted-show-plate"), size: "6×8″" });
const first = { width: 220, ascent: 70, descent: 0 };
const second = { width: 170, ascent: 70, descent: 0 };
const input = { geometry, first, second, maxFontSize: geometry.registration.maxFontSizeCqw, horizontalScale: geometry.registration.horizontalScale, frameInset: 4.2, hasFlag: false, roadLegal: false };

describe("measured registration layout", () => {
  it("uses the corrected example on empty stacked and single-line plates", () => {
    const show = createDefaultConfiguration("hand-crafted-show-plate");
    const roadLegal = createDefaultConfiguration("2d-road-legal");
    expect(splitRegistration(show, false)).toEqual(["YOUR", "REG"]);
    expect(splitRegistration(roadLegal, false)).toEqual(["YOUR", "REG"]);
    expect(splitRegistration(show, true)).toEqual(["YOUR REG", ""]);
  });
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

  it("keeps both road-legal rows centred and does not shrink them just because a flag is present", () => {
    const legalGeometry = getPlateGeometry(createDefaultConfiguration("2d-road-legal"));
    const legalInput = { ...input, geometry: legalGeometry, maxFontSize: legalGeometry.registration.maxFontSizeCqw, horizontalScale: legalGeometry.registration.horizontalScale, frameInset: 2.7, roadLegal: true };
    const plain = fitRegistrationLayout({ ...legalInput, hasFlag: false });
    const flagged = fitRegistrationLayout({ ...legalInput, hasFlag: true });
    expect(flagged.firstX).toBe(50);
    expect(flagged.secondX).toBe(50);
    expect(flagged.fontSize).toBeCloseTo(plain.fontSize, 5);
  });

  it("centres a flag in the gutter beside the measured lower row", () => {
    const legalGeometry = getPlateGeometry(createDefaultConfiguration("2d-road-legal"));
    const layout = fitRegistrationLayout({ ...input, geometry: legalGeometry, maxFontSize: legalGeometry.registration.maxFontSizeCqw, horizontalScale: legalGeometry.registration.horizontalScale, frameInset: 2.7, hasFlag: true, roadLegal: true });
    const flag = fitFlagPlacement({ geometry: legalGeometry, layout, second, frameInset: 2.7, maxWidthPercent: 11, maxHeightPercent: 27 });
    const inkLeft = layout.secondX - second.width * layout.fontSize / 100 * layout.horizontalScale / 2;
    const gutterLeft = 2.7 + 1.25;
    expect(flag.left + flag.width / 2).toBeCloseTo((gutterLeft + inkLeft - 1.25) / 2, 5);
    expect(flag.left + flag.width).toBeLessThan(inkLeft);
    const rowMiddle = layout.secondBaseline + (second.descent - second.ascent) * layout.fontSize / 200;
    expect((flag.top + flag.height / 2) * (100 / legalGeometry.aspectRatio) / 100).toBeCloseTo(rowMiddle, 5);
  });
});
