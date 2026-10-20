"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { PlateBorderFrame } from "@/components/order/PlateBorderFrame";
import { PlateRegistration } from "@/components/order/PlateRegistration";
import { RoadLegalMarkings } from "@/components/order/RoadLegalMarkings";
import { getCountryFlagDefinition, getPlateAspectRatio, LOGO_ASSETS } from "@/lib/productCatalog";
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampLogoPosition(position: LogoPosition): LogoPosition {
  return { x: clamp(position.x, 11, 89), y: clamp(position.y, 9, 91) };
}

function getRegistrationMaxFontSize(config: PlateConfiguration, singleLine: boolean) {
  const aspectRatio = getPlateAspectRatio(config);
  const ratioScale = Math.min(1, (8 / 6) / aspectRatio);
  const baseSize = singleLine ? 22 : 27.58 * ratioScale;
  return Number(baseSize.toFixed(2));
}

function getSloganFontClass(font: PlateConfiguration["sloganFont"]) {
  if (font === "The Boss") return "plate-slogan-font-boss";
  if (font === "The Scribbler") return "plate-slogan-font-scribbler";
  return "plate-slogan-font-rebel";
}

function getSloganFontSize(text: string, singleLine: boolean) {
  const maximum = singleLine ? 2.8 : 3.5;
  return Number(Math.max(2.15, Math.min(maximum, 84 / Math.max(text.length, 1))).toFixed(2));
}

export function PlatePreview({ compact = false, config, onLogoPositionChange }: { compact?: boolean; config: PlateConfiguration; onLogoPositionChange?: (position: LogoPosition) => void }) {
  const plateRef = useRef<HTMLDivElement>(null);
  const aspectRatio = getPlateAspectRatio(config);
  const singleLine = config.useType === "show" && aspectRatio >= 1.75;
  const [lineOne, lineTwo] = splitRegistration(config, singleLine);
  const logoAsset = config.logo === "Other Logo" ? config.uploadedLogoPreviewUrl : LOGO_ASSETS[config.logo];
  const flagDefinition = getCountryFlagDefinition(config.countryFlag);
  const flagAsset = flagDefinition.assetPath;
  const hasLogo = config.logo !== "No Logo";
  const hasSlogan = config.sloganMode === "custom" && Boolean(config.sloganText);
  const hasFlag = Boolean(flagAsset);
  const interactiveLogo = hasLogo && Boolean(onLogoPositionChange) && !compact;
  const logoPosition = clampLogoPosition(config.logoPosition);
  const registrationMaxFontSize = getRegistrationMaxFontSize(config, singleLine);
  const borderCount = Number(config.innerBorder !== "None") + Number(config.outerBorder !== "None");
  const sloganFontSize = getSloganFontSize(config.sloganText, singleLine);

  function updateLogoFromPointer(clientX: number, clientY: number) {
    const bounds = plateRef.current?.getBoundingClientRect();
    if (!bounds || !onLogoPositionChange) return;
    onLogoPositionChange(clampLogoPosition({
      x: ((clientX - bounds.left) / bounds.width) * 100,
      y: ((clientY - bounds.top) / bounds.height) * 100,
    }));
  }

  return (
    <div
      className={`plate-canvas ${singleLine ? "plate-canvas-landscape" : "plate-canvas-stacked"} relative mx-auto w-full overflow-hidden ${compact ? "max-w-[155px]" : "max-w-[527px]"}`}
      ref={plateRef}
      style={{ aspectRatio }}
    >
      <PlateBorderFrame innerBorder={config.innerBorder} outerBorder={config.outerBorder} roadLegal={config.useType === "road-legal"} />

      {hasLogo ? (
        <div
          aria-label={interactiveLogo ? "Move selected logo. Use arrow keys for fine adjustment." : undefined}
          className={`absolute z-20 grid h-[18%] w-[22%] -translate-x-1/2 -translate-y-1/2 place-items-center ${interactiveLogo ? "cursor-move touch-none rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" : "pointer-events-none"}`}
          onKeyDown={interactiveLogo ? (event) => {
            const distance = event.shiftKey ? 5 : 1;
            const offsets: Partial<Record<string, [number, number]>> = { ArrowLeft: [-distance, 0], ArrowRight: [distance, 0], ArrowUp: [0, -distance], ArrowDown: [0, distance] };
            const offset = offsets[event.key];
            if (!offset || !onLogoPositionChange) return;
            event.preventDefault();
            onLogoPositionChange(clampLogoPosition({ x: config.logoPosition.x + offset[0], y: config.logoPosition.y + offset[1] }));
          } : undefined}
          onPointerDown={interactiveLogo ? (event) => { event.currentTarget.setPointerCapture(event.pointerId); updateLogoFromPointer(event.clientX, event.clientY); } : undefined}
          onPointerMove={interactiveLogo ? (event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updateLogoFromPointer(event.clientX, event.clientY); } : undefined}
          role={interactiveLogo ? "button" : undefined}
          style={{ left: `${logoPosition.x}%`, top: `${logoPosition.y}%` }}
          tabIndex={interactiveLogo ? 0 : undefined}
        >
          {logoAsset ? <Image alt={`${config.logo} logo`} className="pointer-events-none object-contain" draggable={false} fill sizes={compact ? "32px" : "100px"} src={logoAsset} unoptimized={logoAsset.startsWith("blob:")} /> : <span className="rounded border border-[var(--plate-ink)] px-[1.5cqw] py-[0.5cqw] text-[2.6cqw] font-bold text-[var(--plate-ink)]">PDF</span>}
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

      <PlateRegistration borderCount={borderCount} hasFlag={hasFlag} hasLogo={hasLogo} hasSlogan={hasSlogan} lineOne={lineOne} lineTwo={lineTwo} maxFontSizeCqw={registrationMaxFontSize} singleLine={singleLine} />

      {hasSlogan ? <div className={`plate-slogan ${getSloganFontClass(config.sloganFont)} absolute z-10 text-center text-[var(--plate-ink)]`} style={{ "--plate-slogan-size": `${sloganFontSize}cqw` } as CSSProperties}>{config.sloganText}</div> : null}

      {config.useType === "road-legal" ? <RoadLegalMarkings hasInnerBorder={config.innerBorder !== "None"} /> : null}
    </div>
  );
}
