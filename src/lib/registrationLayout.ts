import type { PlateGeometry } from "@/lib/plateGeometry";

export type InkMetrics = { width: number; ascent: number; descent: number };
export type LogoBounds = { left: number; right: number; top: number; bottom: number };
export type RegistrationLayout = { fontSize: number; horizontalScale: number; firstBaseline: number; secondBaseline: number; firstX: number; secondX: number; top: number; bottom: number };

type LayoutInput = {
  geometry: PlateGeometry;
  first: InkMetrics;
  second: InkMetrics;
  maxFontSize: number;
  horizontalScale: number;
  frameInset: number;
  hasFlag: boolean;
  roadLegal: boolean;
  logoBounds?: LogoBounds;
  sloganTop?: number;
};

export function fitRegistrationLayout({ geometry, first, second, maxFontSize, horizontalScale, frameInset, hasFlag, roadLegal, logoBounds, sloganTop }: LayoutInput): RegistrationLayout {
  const height = 100 / geometry.aspectRatio;
  const singleLine = geometry.registration.singleLine;
  const firstX = 50;
  const secondX = hasFlag ? 57.25 : 50;
  const edgeInset = Math.max(geometry.registration.horizontalInsetPercent, frameInset + 1.25);
  const firstWidth = 100 - edgeInset * 2;
  const secondWidth = hasFlag ? 76.5 : firstWidth;
  const widthFit = Math.min(
    maxFontSize,
    first.width > 0 ? firstWidth * 100 / (first.width * horizontalScale) : maxFontSize,
    !singleLine && second.width > 0 ? secondWidth * 100 / (second.width * horizontalScale) : maxFontSize,
  );
  const margin = singleLine ? 1.7 : 1.9;
  const safeTop = frameInset + margin;
  let safeBottom = height - frameInset - margin;
  if (roadLegal) {
    const legalBottom = geometry.innerInsetCqw > 0 && frameInset > 0 ? height * 0.064 : height * 0.022;
    safeBottom = Math.min(safeBottom, height - legalBottom - 2.55);
  }
  if (sloganTop !== undefined) safeBottom = Math.min(safeBottom, sloganTop - 1.15);

  const measureGroup = (fontSize: number) => {
    const scale = fontSize / 100;
    const advance = singleLine ? 0 : (geometry.registration.secondRowTopPercent - geometry.registration.firstRowTopPercent) / 100 * height * fontSize / maxFontSize;
    const top = singleLine ? -first.ascent * scale : Math.min(-first.ascent * scale, advance - second.ascent * scale);
    const bottom = singleLine ? first.descent * scale : Math.max(first.descent * scale, advance + second.descent * scale);
    return { advance, top, bottom, height: bottom - top };
  };

  let fontSize = widthFit;
  let group = measureGroup(fontSize);
  let topLimit = safeTop;
  const normalBaseline = (safeTop + safeBottom - group.top - group.bottom) / 2;
  const normalFirstTop = normalBaseline - first.ascent * fontSize / 100;
  const normalFirstBottom = normalBaseline + first.descent * fontSize / 100;
  const firstHalfWidth = first.width * fontSize / 100 * horizontalScale / 2;
  if (logoBounds && logoBounds.top < normalFirstTop + (normalFirstBottom - normalFirstTop) / 2 && logoBounds.bottom > normalFirstTop - 1.25 && logoBounds.left < firstX + firstHalfWidth + 1.25 && logoBounds.right > firstX - firstHalfWidth - 1.25) {
    topLimit = Math.max(topLimit, logoBounds.bottom + 1.15);
  }

  const availableHeight = Math.max(1, safeBottom - topLimit);
  if (group.height > availableHeight) {
    fontSize *= availableHeight / group.height;
    group = measureGroup(fontSize);
  }
  const fittedHorizontalScale = horizontalScale * widthFit / fontSize;
  const firstBaseline = (topLimit + safeBottom - group.top - group.bottom) / 2;
  return {
    fontSize,
    horizontalScale: fittedHorizontalScale,
    firstBaseline,
    secondBaseline: firstBaseline + group.advance,
    firstX,
    secondX,
    top: firstBaseline + group.top,
    bottom: firstBaseline + group.bottom,
  };
}
