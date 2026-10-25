"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PlateBorderFrame } from "@/components/order/PlateBorderFrame";
import { PlateRegistration } from "@/components/order/PlateRegistration";
import { RoadLegalMarkings } from "@/components/order/RoadLegalMarkings";
import { clampLogoPosition, fitLogoVisualSize, getLogoAspectRatio } from "@/lib/logoLayout";
import { getPlateGeometry } from "@/lib/plateGeometry";
import { getCountryFlagDefinition, getLogoDefinition } from "@/lib/productCatalog";
import type { LogoPosition, PlateConfiguration } from "@/types/order";

function splitRegistration(config: PlateConfiguration, singleLine: boolean): [string, string] {
  const uppercaseRegistration = config.registration.toUpperCase();
  if (singleLine) return [uppercaseRegistration.trim() || "YOUR REG", ""];
  if (config.useType === "road-legal") {
    const canonical = uppercaseRegistration.replace(/\s+/g, "");
    return canonical ? [canonical.slice(0, 4), canonical.slice(4)] : ["YOUR", "REJ"];
  }
  const value = uppercaseRegistration.trim();
  if (!value) return ["YOUR", "REJ"];
  const parts = value.split(/\s+/);
  if (parts.length > 1) return [parts.slice(0, -1).join(" "), parts.at(-1) ?? ""];
  const midpoint = Math.ceil(value.length / 2);
  return [value.slice(0, midpoint), value.slice(midpoint)];
}

function getSloganFontClass(font: PlateConfiguration["sloganFont"]) {
  if (font === "The Boss") return "plate-slogan-font-boss";
  if (font === "The Scribbler") return "plate-slogan-font-scribbler";
  return "plate-slogan-font-rebel";
}

function getSloganFontSize(text: string, maximum: number) {
  return Number(Math.max(2.15, Math.min(maximum, 84 / Math.max(text.length, 1))).toFixed(2));
}

export function PlatePreview({ compact = false, config, fluid = false, onLogoPositionChange }: { compact?: boolean; config: PlateConfiguration; fluid?: boolean; onLogoPositionChange?: (position: LogoPosition) => void }) {
  const plateRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<LogoPosition>({ x: 0, y: 0 });
  const [uploadedAspectRatio, setUploadedAspectRatio] = useState<number | null>(null);
  const geometry = getPlateGeometry(config);
  const singleLine = geometry.registration.singleLine;
  const [lineOne, lineTwo] = splitRegistration(config, singleLine);
  const logoDefinition = getLogoDefinition(config.logo);
  const logoAsset = config.logo === "Other Logo" ? config.uploadedLogoPreviewUrl : logoDefinition?.assetPath;
  const flagDefinition = getCountryFlagDefinition(config.countryFlag);
  const flagAsset = flagDefinition.assetPath;
  const hasLogo = config.logo !== "No Logo";
  const hasSlogan = config.sloganMode === "custom" && Boolean(config.sloganText);
  const hasFlag = Boolean(flagAsset);
  const interactiveLogo = hasLogo && Boolean(onLogoPositionChange) && !compact;
  const logoSize = fitLogoVisualSize(geometry, getLogoAspectRatio(config, uploadedAspectRatio));
  const logoPosition = clampLogoPosition(config.logoPosition, config, geometry, logoSize);
  const borderCount = Number(config.innerBorder !== "None") + Number(config.outerBorder !== "None");
  const sloganFontSize = getSloganFontSize(config.sloganText, geometry.slogan.maxFontSizeCqw);
  const registrationFirstTop = hasLogo ? hasSlogan ? geometry.registration.logoSloganFirstRowTopPercent : geometry.registration.logoFirstRowTopPercent : geometry.registration.firstRowTopPercent;
  const registrationSecondTop = hasLogo ? hasSlogan ? geometry.registration.logoSloganSecondRowTopPercent : geometry.registration.logoSecondRowTopPercent : geometry.registration.secondRowTopPercent;
  const registrationSingleTop = hasLogo ? hasSlogan ? geometry.registration.logoSloganSingleRowTopPercent : geometry.registration.logoSingleRowTopPercent : geometry.registration.singleRowTopPercent;
  const outerMaterialClass = config.outerBorder === "Black" ? "plate-canvas-outer-black" : config.outerBorder === "Mirror Silver" ? "plate-canvas-outer-silver" : "";
  const plateStyle = {
    aspectRatio: geometry.aspectRatio,
    "--plate-self-corner-x": `${geometry.cornerRadiusCqw}%`,
    "--plate-self-corner-y": `${geometry.cornerRadiusCqw * geometry.aspectRatio}%`,
    "--plate-corner-radius": `${geometry.cornerRadiusCqw}cqw`,
    "--plate-inner-inset": `${geometry.innerInsetCqw}cqw`,
    "--plate-inner-band": `${geometry.innerBandCqw}cqw`,
    "--plate-outer-band": `${geometry.outerBandCqw}cqw`,
    "--plate-double-band": `${geometry.doubleBandCqw}cqw`,
    "--plate-mixed-band": `${geometry.doubleBandCqw / 2}cqw`,
    "--plate-registration-inset": `${geometry.registration.horizontalInsetPercent}%`,
    "--plate-registration-first-top": `${registrationFirstTop}%`,
    "--plate-registration-second-top": `${registrationSecondTop}%`,
    "--plate-registration-single-top": `${registrationSingleTop}%`,
    "--plate-slogan-bottom": `${geometry.slogan.bottomPercent}%`,
    "--plate-slogan-bordered-bottom": `${geometry.slogan.borderedBottomPercent}%`,
  } as CSSProperties;

  useEffect(() => setUploadedAspectRatio(null), [logoAsset]);

  function updateLogoFromPointer(clientX: number, clientY: number) {
    const bounds = plateRef.current?.getBoundingClientRect();
    if (!bounds || !onLogoPositionChange) return;
    onLogoPositionChange(clampLogoPosition({
      x: ((clientX - bounds.left) / bounds.width) * 100 - dragOffsetRef.current.x,
      y: ((clientY - bounds.top) / bounds.height) * 100 - dragOffsetRef.current.y,
    }, config, geometry, logoSize));
  }

  return (
    <div
      className={`plate-canvas ${singleLine ? "plate-canvas-landscape" : "plate-canvas-stacked"} ${outerMaterialClass} relative mx-auto w-full overflow-hidden ${compact ? "max-w-[155px]" : fluid ? "max-w-none" : "max-w-[527px]"}`}
      ref={plateRef}
      style={plateStyle}
    >
      <PlateBorderFrame innerBorder={config.innerBorder} outerBorder={config.outerBorder} roadLegal={config.useType === "road-legal"} />

      {hasLogo ? (
        <div
          className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 overflow-hidden ${interactiveLogo ? "cursor-grab touch-none active:cursor-grabbing" : "pointer-events-none"}`}
          onPointerCancel={interactiveLogo ? (event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); } : undefined}
          onPointerDown={interactiveLogo ? (event) => {
            const bounds = plateRef.current?.getBoundingClientRect();
            if (!bounds) return;
            event.preventDefault();
            dragOffsetRef.current = {
              x: ((event.clientX - bounds.left) / bounds.width) * 100 - logoPosition.x,
              y: ((event.clientY - bounds.top) / bounds.height) * 100 - logoPosition.y,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          } : undefined}
          onPointerMove={interactiveLogo ? (event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updateLogoFromPointer(event.clientX, event.clientY); } : undefined}
          onPointerUp={interactiveLogo ? (event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); } : undefined}
          style={{ left: `${logoPosition.x}%`, top: `${logoPosition.y}%`, width: `${logoSize.widthPercent}%`, height: `${logoSize.heightPercent}%` }}
        >
          {logoDefinition ? (
            <Image
              alt={`${config.logo} logo`}
              className="pointer-events-none absolute max-w-none"
              draggable={false}
              height={logoDefinition.sourceHeight}
              src={logoDefinition.assetPath}
              style={{
                left: `${-logoDefinition.contentBounds.x / logoDefinition.contentBounds.width * 100}%`,
                top: `${-logoDefinition.contentBounds.y / logoDefinition.contentBounds.height * 100}%`,
                width: `${logoDefinition.sourceWidth / logoDefinition.contentBounds.width * 100}%`,
                height: `${logoDefinition.sourceHeight / logoDefinition.contentBounds.height * 100}%`,
              }}
              width={logoDefinition.sourceWidth}
            />
          ) : logoAsset ? (
            <Image alt={`${config.logo} logo`} className="pointer-events-none object-contain" draggable={false} fill onLoad={(event) => { const image = event.currentTarget; if (image.naturalWidth && image.naturalHeight) setUploadedAspectRatio(image.naturalWidth / image.naturalHeight); }} sizes={compact ? "32px" : "100px"} src={logoAsset} unoptimized={logoAsset.startsWith("blob:")} />
          ) : <span className="grid size-full place-items-center rounded border border-[var(--plate-ink)] text-[2.6cqw] font-bold text-[var(--plate-ink)]">PDF</span>}
        </div>
      ) : null}

      {flagAsset ? (
        <div
          className="plate-flag absolute z-10"
          data-orientation={flagDefinition.orientation}
          style={{
            left: `${flagDefinition.printableRegion.left}%`,
            top: `${flagDefinition.printableRegion.top}%`,
            width: `${flagDefinition.printableRegion.width}%`,
            height: `${flagDefinition.printableRegion.height}%`,
          }}
        >
          <Image
            alt={flagDefinition.label}
            className="object-contain"
            fill
            sizes={compact ? "24px" : "64px"}
            src={flagAsset}
          />
        </div>
      ) : null}

      <PlateRegistration borderCount={borderCount} hasFlag={hasFlag} hasLogo={hasLogo} hasSlogan={hasSlogan} horizontalScale={geometry.registration.horizontalScale} lineOne={lineOne} lineTwo={lineTwo} maxFontSizeCqw={geometry.registration.maxFontSizeCqw} singleLine={singleLine} />

      {hasSlogan ? <div className={`plate-slogan plate-slogan-border-${Math.min(borderCount, 2)} ${getSloganFontClass(config.sloganFont)} absolute z-10 text-center text-[var(--plate-ink)]`} style={{ "--plate-slogan-size": `${sloganFontSize}cqw` } as CSSProperties}>{config.sloganText}</div> : null}

      {config.useType === "road-legal" ? <RoadLegalMarkings hasInnerBorder={config.innerBorder !== "None"} /> : null}
    </div>
  );
}
