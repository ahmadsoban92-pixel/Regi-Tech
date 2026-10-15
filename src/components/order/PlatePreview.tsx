"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { PlateBorderFrame } from "@/components/order/PlateBorderFrame";
import { PlateRegistration } from "@/components/order/PlateRegistration";
import { FLAG_ASSETS, getPlateAspectRatio, LOGO_ASSETS } from "@/lib/productCatalog";
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

function flagIdentifier(flag: PlateConfiguration["countryFlag"]) {
  return { "Union Jack": "UK", England: "ENG", Scotland: "SCO", Wales: "CYMRU", None: "" }[flag];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampLogoPosition(position: LogoPosition, hasSlogan: boolean): LogoPosition {
  return { x: clamp(position.x, 15, 85), y: clamp(position.y, 12, hasSlogan ? 74 : 85) };
}

function getRegistrationMaxFontSize(config: PlateConfiguration, singleLine: boolean, hasLogo: boolean, hasSlogan: boolean, hasFlag: boolean) {
  const aspectRatio = getPlateAspectRatio(config);
  const ratioScale = Math.min(1, (8 / 6) / aspectRatio);
  const baseSize = singleLine ? 22 : 27.58 * ratioScale;
  const contentScale = hasLogo && hasSlogan ? 0.72 : hasLogo ? 0.84 : hasSlogan ? 0.83 : 1;
  const flagScale = hasFlag ? 0.82 : 1;
  return Number((baseSize * contentScale * flagScale).toFixed(2));
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
  const flagAsset = FLAG_ASSETS[config.countryFlag];
  const hasLogo = config.logo !== "No Logo";
  const hasSlogan = config.sloganMode === "custom" && Boolean(config.sloganText);
  const hasFlag = Boolean(flagAsset);
  const interactiveLogo = hasLogo && Boolean(onLogoPositionChange) && !compact;
  const logoPosition = clampLogoPosition(config.logoPosition, hasSlogan);
  const registrationMaxFontSize = getRegistrationMaxFontSize(config, singleLine, hasLogo, hasSlogan, hasFlag);
  const borderCount = Number(config.innerBorder !== "None") + Number(config.outerBorder !== "None");
  const sloganFontSize = getSloganFontSize(config.sloganText, singleLine);

  function updateLogoFromPointer(clientX: number, clientY: number) {
    const bounds = plateRef.current?.getBoundingClientRect();
    if (!bounds || !onLogoPositionChange) return;
    onLogoPositionChange(clampLogoPosition({
      x: ((clientX - bounds.left) / bounds.width) * 100,
      y: ((clientY - bounds.top) / bounds.height) * 100,
    }, hasSlogan));
  }

  return (
    <div
      className={`plate-canvas ${singleLine ? "plate-canvas-landscape" : "plate-canvas-stacked"} relative mx-auto w-full overflow-hidden ${compact ? "max-w-[155px]" : "max-w-[527px]"}`}
      ref={plateRef}
      style={{ aspectRatio }}
    >
      <PlateBorderFrame innerBorder={config.innerBorder} outerBorder={config.outerBorder} />

      {hasLogo ? (
        <div
          aria-label={interactiveLogo ? "Move selected logo. Use arrow keys for fine adjustment." : undefined}
          className={`absolute z-20 grid h-[10%] w-[17%] -translate-x-1/2 -translate-y-1/2 place-items-center ${interactiveLogo ? "cursor-move touch-none rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" : "pointer-events-none"}`}
          onKeyDown={interactiveLogo ? (event) => {
            const distance = event.shiftKey ? 5 : 1;
            const offsets: Partial<Record<string, [number, number]>> = { ArrowLeft: [-distance, 0], ArrowRight: [distance, 0], ArrowUp: [0, -distance], ArrowDown: [0, distance] };
            const offset = offsets[event.key];
            if (!offset || !onLogoPositionChange) return;
            event.preventDefault();
            onLogoPositionChange(clampLogoPosition({ x: config.logoPosition.x + offset[0], y: config.logoPosition.y + offset[1] }, hasSlogan));
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

      {flagAsset ? <div className="plate-flag absolute z-10 flex flex-col items-center"><div className="plate-flag-art relative w-full"><Image alt={`${config.countryFlag} country flag`} className="object-contain" fill sizes={compact ? "18px" : "56px"} src={flagAsset} /></div><span className="plate-flag-identifier font-bold leading-none text-[var(--plate-ink)]">{flagIdentifier(config.countryFlag)}</span></div> : null}

      <PlateRegistration borderCount={borderCount} hasFlag={hasFlag} hasLogo={hasLogo} hasSlogan={hasSlogan} lineOne={lineOne} lineTwo={lineTwo} maxFontSizeCqw={registrationMaxFontSize} singleLine={singleLine} />

      {hasSlogan ? <div className="plate-slogan absolute z-10 text-center text-[var(--plate-ink)]" style={{ "--plate-slogan-size": `${sloganFontSize}cqw` } as CSSProperties}>{config.sloganText}</div> : null}

      {config.useType === "road-legal" ? <div aria-hidden className="absolute inset-x-[8%] bottom-[2.2%] z-10 flex items-end justify-between gap-3 text-[1.55cqw] font-semibold leading-none text-[var(--plate-ink)]"><span>License Plate Workshop Ltd RG1 6LB</span><span>BS AU 145e</span></div> : null}
    </div>
  );
}
