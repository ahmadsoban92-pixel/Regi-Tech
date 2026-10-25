import { getPlateGeometry, type PlateGeometry } from "@/lib/plateGeometry";
import { getLogoDefinition } from "@/lib/productCatalog";
import type { LogoPosition, PlateConfiguration } from "@/types/order";

export type LogoVisualSize = { widthPercent: number; heightPercent: number };

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getLogoAspectRatio(config: PlateConfiguration, uploadedAspectRatio?: number | null) {
  if (config.logo === "Other Logo") return uploadedAspectRatio && uploadedAspectRatio > 0 ? uploadedAspectRatio : 1;
  const definition = getLogoDefinition(config.logo);
  return definition ? definition.contentBounds.width / definition.contentBounds.height : 1;
}

export function fitLogoVisualSize(geometry: PlateGeometry, logoAspectRatio: number): LogoVisualSize {
  const widthFromHeight = geometry.logo.maxHeightPercent * logoAspectRatio / geometry.aspectRatio;
  const widthPercent = Math.min(geometry.logo.maxWidthPercent, widthFromHeight);
  return {
    widthPercent,
    heightPercent: widthPercent * geometry.aspectRatio / logoAspectRatio,
  };
}

export function getLogoFrameInsetCqw(config: PlateConfiguration, geometry: PlateGeometry) {
  const hasInner = config.innerBorder !== "None";
  const hasOuter = config.outerBorder !== "None";
  if (hasInner && hasOuter) return geometry.doubleBandCqw;
  if (hasInner) return geometry.innerInsetCqw + geometry.innerBandCqw;
  if (hasOuter) return geometry.outerBandCqw;
  return geometry.logo.edgeInsetPercent;
}

function keepBoxInsideRoundedCorner(
  center: { x: number; y: number },
  halfWidth: number,
  halfHeight: number,
  inset: number,
  heightInWidthUnits: number,
  radius: number,
) {
  if (radius <= 0) return center;
  const corners = [
    { boxX: center.x - halfWidth, boxY: center.y - halfHeight, arcX: inset + radius, arcY: inset + radius, sideX: -1, sideY: -1 },
    { boxX: center.x + halfWidth, boxY: center.y - halfHeight, arcX: 100 - inset - radius, arcY: inset + radius, sideX: 1, sideY: -1 },
    { boxX: center.x - halfWidth, boxY: center.y + halfHeight, arcX: inset + radius, arcY: heightInWidthUnits - inset - radius, sideX: -1, sideY: 1 },
    { boxX: center.x + halfWidth, boxY: center.y + halfHeight, arcX: 100 - inset - radius, arcY: heightInWidthUnits - inset - radius, sideX: 1, sideY: 1 },
  ];

  for (const corner of corners) {
    const insideCornerSquare = corner.sideX < 0 ? corner.boxX < corner.arcX : corner.boxX > corner.arcX;
    const insideCornerHeight = corner.sideY < 0 ? corner.boxY < corner.arcY : corner.boxY > corner.arcY;
    if (!insideCornerSquare || !insideCornerHeight) continue;
    const dx = corner.boxX - corner.arcX;
    const dy = corner.boxY - corner.arcY;
    const distance = Math.hypot(dx, dy);
    if (distance <= radius || distance === 0) continue;
    center.x += corner.arcX + (dx / distance) * radius - corner.boxX;
    center.y += corner.arcY + (dy / distance) * radius - corner.boxY;
  }
  return center;
}

export function clampLogoPosition(position: LogoPosition, config: PlateConfiguration, geometry: PlateGeometry, size: LogoVisualSize): LogoPosition {
  const inset = getLogoFrameInsetCqw(config, geometry);
  const heightInWidthUnits = 100 / geometry.aspectRatio;
  const halfWidth = size.widthPercent / 2;
  const halfHeight = size.heightPercent / (2 * geometry.aspectRatio);
  const center = {
    x: clamp(position.x, inset + halfWidth, 100 - inset - halfWidth),
    y: clamp(position.y / geometry.aspectRatio, inset + halfHeight, heightInWidthUnits - inset - halfHeight),
  };
  const radius = Math.max(0, geometry.cornerRadiusCqw - inset);

  keepBoxInsideRoundedCorner(center, halfWidth, halfHeight, inset, heightInWidthUnits, radius);
  center.x = clamp(center.x, inset + halfWidth, 100 - inset - halfWidth);
  center.y = clamp(center.y, inset + halfHeight, heightInWidthUnits - inset - halfHeight);
  return { x: center.x, y: center.y * geometry.aspectRatio };
}

export function getDefaultLogoPosition(config: PlateConfiguration, uploadedAspectRatio?: number | null): LogoPosition {
  const geometry = getPlateGeometry(config);
  const size = fitLogoVisualSize(geometry, getLogoAspectRatio(config, uploadedAspectRatio));
  const topInsetPercent = getLogoFrameInsetCqw(config, geometry) * geometry.aspectRatio;
  return clampLogoPosition({ x: 50, y: topInsetPercent + size.heightPercent / 2 + 1.25 }, config, geometry, size);
}
