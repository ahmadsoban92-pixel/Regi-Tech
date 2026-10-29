import { getPlateAspectRatio } from "@/lib/productCatalog";
import type { PlateConfiguration, PlateSize } from "@/types/order";

export type PlateGeometry = {
  aspectRatio: number;
  cornerRadiusCqw: number;
  innerInsetCqw: number;
  innerBandCqw: number;
  outerBandCqw: number;
  doubleBandCqw: number;
  registration: {
    singleLine: boolean;
    horizontalInsetPercent: number;
    firstRowTopPercent: number;
    secondRowTopPercent: number;
    singleRowTopPercent: number;
    logoFirstRowTopPercent: number;
    logoSecondRowTopPercent: number;
    logoSingleRowTopPercent: number;
    logoSloganFirstRowTopPercent: number;
    logoSloganSecondRowTopPercent: number;
    logoSloganSingleRowTopPercent: number;
    maxFontSizeCqw: number;
    fallbackFontSizeCqw: number;
    horizontalScale: number;
    sloganMaxFontSizeCqw: number;
    logoMaxFontSizeCqw: number;
    logoSloganMaxFontSizeCqw: number;
    sloganFirstRowTopPercent: number;
    sloganSecondRowTopPercent: number;
  };
  slogan: {
    bottomPercent: number;
    borderedBottomPercent: number;
    maxFontSizeCqw: number;
  };
  logo: {
    maxWidthPercent: number;
    maxHeightPercent: number;
    edgeInsetPercent: number;
  };
};

type StandardPlateSize = Exclude<PlateSize, "Custom">;

// Character caps follow the client's approximate millimetre guide. The preview
// still measures each registration and reduces its size when options need space.
const STANDARD_GEOMETRY: Record<StandardPlateSize, Omit<PlateGeometry, "aspectRatio">> = {
  "3×7″": {
    cornerRadiusCqw: 2.55,
    innerInsetCqw: 2.35,
    innerBandCqw: 1.85,
    outerBandCqw: 2.35,
    doubleBandCqw: 3.35,
    registration: {
      singleLine: true,
      horizontalInsetPercent: 3.25,
      firstRowTopPercent: 47,
      secondRowTopPercent: 53.25,
      singleRowTopPercent: 46,
      logoFirstRowTopPercent: 24,
      logoSecondRowTopPercent: 55,
      logoSingleRowTopPercent: 53,
      logoSloganFirstRowTopPercent: 23,
      logoSloganSecondRowTopPercent: 54,
      logoSloganSingleRowTopPercent: 51,
      maxFontSizeCqw: 40.5,
      fallbackFontSizeCqw: 27,
      horizontalScale: 0.63,
      sloganMaxFontSizeCqw: 36,
      logoMaxFontSizeCqw: 38,
      logoSloganMaxFontSizeCqw: 35,
      sloganFirstRowTopPercent: 47,
      sloganSecondRowTopPercent: 53.25,
    },
    slogan: { bottomPercent: 7.5, borderedBottomPercent: 10.5, maxFontSizeCqw: 2.8 },
    logo: { maxWidthPercent: 20, maxHeightPercent: 16, edgeInsetPercent: 1.25 },
  },
  "4×6″": {
    cornerRadiusCqw: 3.45,
    innerInsetCqw: 2.35,
    innerBandCqw: 1.85,
    outerBandCqw: 2.35,
    doubleBandCqw: 3.35,
    registration: {
      singleLine: false,
      horizontalInsetPercent: 4.25,
      firstRowTopPercent: 8.5,
      secondRowTopPercent: 51.5,
      singleRowTopPercent: 47,
      logoFirstRowTopPercent: 24,
      logoSecondRowTopPercent: 55,
      logoSingleRowTopPercent: 53,
      logoSloganFirstRowTopPercent: 23,
      logoSloganSecondRowTopPercent: 54,
      logoSloganSingleRowTopPercent: 51,
      maxFontSizeCqw: 38.8,
      fallbackFontSizeCqw: 34,
      horizontalScale: 0.95,
      sloganMaxFontSizeCqw: 35,
      logoMaxFontSizeCqw: 30,
      logoSloganMaxFontSizeCqw: 29,
      sloganFirstRowTopPercent: 8.5,
      sloganSecondRowTopPercent: 48,
    },
    slogan: { bottomPercent: 5.5, borderedBottomPercent: 7.5, maxFontSizeCqw: 3.5 },
    logo: { maxWidthPercent: 20, maxHeightPercent: 16, edgeInsetPercent: 1.5 },
  },
  "5×7″": {
    cornerRadiusCqw: 3.1,
    innerInsetCqw: 2.35,
    innerBandCqw: 1.85,
    outerBandCqw: 2.35,
    doubleBandCqw: 3.35,
    registration: {
      singleLine: false,
      horizontalInsetPercent: 4.5,
      firstRowTopPercent: 9,
      secondRowTopPercent: 52,
      singleRowTopPercent: 47,
      logoFirstRowTopPercent: 24,
      logoSecondRowTopPercent: 55,
      logoSingleRowTopPercent: 53,
      logoSloganFirstRowTopPercent: 23,
      logoSloganSecondRowTopPercent: 54,
      logoSloganSingleRowTopPercent: 51,
      maxFontSizeCqw: 40.7,
      fallbackFontSizeCqw: 34,
      horizontalScale: 0.95,
      sloganMaxFontSizeCqw: 36,
      logoMaxFontSizeCqw: 30,
      logoSloganMaxFontSizeCqw: 29,
      sloganFirstRowTopPercent: 9,
      sloganSecondRowTopPercent: 49,
    },
    slogan: { bottomPercent: 5.75, borderedBottomPercent: 8, maxFontSizeCqw: 3.4 },
    logo: { maxWidthPercent: 20, maxHeightPercent: 16, edgeInsetPercent: 1.5 },
  },
  "6×8″": {
    cornerRadiusCqw: 2.9,
    innerInsetCqw: 2.35,
    innerBandCqw: 1.85,
    outerBandCqw: 2.35,
    doubleBandCqw: 3.35,
    registration: {
      singleLine: false,
      horizontalInsetPercent: 4.75,
      firstRowTopPercent: 9.5,
      secondRowTopPercent: 52.25,
      singleRowTopPercent: 47,
      logoFirstRowTopPercent: 24,
      logoSecondRowTopPercent: 55,
      logoSingleRowTopPercent: 53,
      logoSloganFirstRowTopPercent: 23,
      logoSloganSecondRowTopPercent: 54,
      logoSloganSingleRowTopPercent: 51,
      maxFontSizeCqw: 40,
      fallbackFontSizeCqw: 33,
      horizontalScale: 0.95,
      sloganMaxFontSizeCqw: 36,
      logoMaxFontSizeCqw: 30,
      logoSloganMaxFontSizeCqw: 29,
      sloganFirstRowTopPercent: 9.5,
      sloganSecondRowTopPercent: 49,
    },
    slogan: { bottomPercent: 6, borderedBottomPercent: 8.25, maxFontSizeCqw: 3.3 },
    logo: { maxWidthPercent: 20, maxHeightPercent: 16, edgeInsetPercent: 1.5 },
  },
  "7×9″": {
    cornerRadiusCqw: 2.75,
    innerInsetCqw: 1.35,
    innerBandCqw: 1.35,
    outerBandCqw: 2.35,
    doubleBandCqw: 3.35,
    registration: {
      singleLine: false,
      horizontalInsetPercent: 5.25,
      firstRowTopPercent: 9.75,
      secondRowTopPercent: 52.75,
      singleRowTopPercent: 47,
      logoFirstRowTopPercent: 24,
      logoSecondRowTopPercent: 55,
      logoSingleRowTopPercent: 53,
      logoSloganFirstRowTopPercent: 23,
      logoSloganSecondRowTopPercent: 54,
      logoSloganSingleRowTopPercent: 51,
      maxFontSizeCqw: 40.5,
      fallbackFontSizeCqw: 31.5,
      horizontalScale: 0.95,
      sloganMaxFontSizeCqw: 40.5,
      logoMaxFontSizeCqw: 40.5,
      logoSloganMaxFontSizeCqw: 40.5,
      sloganFirstRowTopPercent: 9.75,
      sloganSecondRowTopPercent: 52.75,
    },
    slogan: { bottomPercent: 6, borderedBottomPercent: 8.25, maxFontSizeCqw: 3.2 },
    logo: { maxWidthPercent: 22, maxHeightPercent: 18, edgeInsetPercent: 1.5 },
  },
};

export function getPlateGeometry(config: PlateConfiguration): PlateGeometry {
  const aspectRatio = getPlateAspectRatio(config);
  if (config.size !== "Custom") return { ...STANDARD_GEOMETRY[config.size], aspectRatio };

  const singleLine = config.useType === "show" && aspectRatio >= 1.75;
  const reference = singleLine ? STANDARD_GEOMETRY["3×7″"] : STANDARD_GEOMETRY["6×8″"];
  return {
    ...reference,
    aspectRatio,
    registration: { ...reference.registration, singleLine },
  };
}
