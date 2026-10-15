"use client";

import Image from "next/image";
import { useRef } from "react";
import { PlateRegistration } from "@/components/order/PlateRegistration";
import { FLAG_ASSETS, getPlateAspectRatio, LOGO_ASSETS } from "@/lib/productCatalog";
import type { LogoPosition, PlateConfiguration } from "@/types/order";

function splitRegistration(config: PlateConfiguration): [string, string] {
  if (config.useType === "road-legal") {
    const canonical = config.registration.replace(/\s+/g, "").toUpperCase();
    return canonical ? [canonical.slice(0, 4), canonical.slice(4)] : ["YOUR", "REJ"];
  }
  const value = config.registration.trim();
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

function clampLogoPosition(position: LogoPosition): LogoPosition {
  return { x: clamp(position.x, 12, 88), y: clamp(position.y, 10, 90) };
}

export function PlatePreview({ compact = false, config, onLogoPositionChange, side = "rear" }: { compact?: boolean; config: PlateConfiguration; onLogoPositionChange?: (position: LogoPosition) => void; side?: "front" | "rear" }) {
  const plateRef = useRef<HTMLDivElement>(null);
  const [lineOne, lineTwo] = splitRegistration(config);
  const logoAsset = config.logo === "Other Logo" ? config.uploadedLogoPreviewUrl : LOGO_ASSETS[config.logo];
  const flagAsset = FLAG_ASSETS[config.countryFlag];
  const hasLogo = config.logo !== "No Logo";
  const hasSlogan = config.sloganMode === "custom" && Boolean(config.sloganText);
  const interactiveLogo = hasLogo && Boolean(onLogoPositionChange) && !compact;

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
      className={`plate-canvas relative mx-auto w-full overflow-hidden rounded-[2.2cqw] border border-[var(--plate-edge)] ${side === "front" ? "bg-[var(--plate-front)]" : "bg-[var(--plate-rear)]"} ${compact ? "max-w-[155px]" : "max-w-[527px]"}`}
      ref={plateRef}
      style={{ aspectRatio: getPlateAspectRatio(config) }}
    >
      {config.outerBorder !== "None" ? <span aria-hidden className={`plate-border plate-border-outer ${config.outerBorder === "Mirror Silver" ? "plate-border-mirror" : "plate-border-black"}`} /> : null}
      {config.innerBorder !== "None" ? <span aria-hidden className={`plate-border plate-border-inner ${config.innerBorder === "Mirror Silver" ? "plate-border-mirror" : "plate-border-black"}`} /> : null}

      {hasLogo ? (
        <div
          aria-label={interactiveLogo ? "Move selected logo. Use arrow keys for fine adjustment." : undefined}
          className={`absolute z-20 grid h-[13%] w-[19%] -translate-x-1/2 -translate-y-1/2 place-items-center ${interactiveLogo ? "cursor-move touch-none rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" : "pointer-events-none"}`}
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
          style={{ left: `${config.logoPosition.x}%`, top: `${config.logoPosition.y}%` }}
          tabIndex={interactiveLogo ? 0 : undefined}
        >
          {logoAsset ? <Image alt={`${config.logo} logo`} className="pointer-events-none object-contain" draggable={false} fill sizes={compact ? "32px" : "100px"} src={logoAsset} unoptimized={logoAsset.startsWith("blob:")} /> : <span className="rounded border border-[var(--plate-ink)] px-[1.5cqw] py-[0.5cqw] text-[2.6cqw] font-bold text-[var(--plate-ink)]">PDF</span>}
        </div>
      ) : null}

      {flagAsset ? <div className="absolute left-[6%] top-[51%] z-10 flex w-[13%] flex-col items-center"><div className="relative aspect-[4/3] w-full"><Image alt={`${config.countryFlag} country flag`} className="object-contain" fill sizes={compact ? "18px" : "70px"} src={flagAsset} /></div><span className="mt-[0.5cqw] text-[4cqw] font-bold leading-none text-[var(--plate-ink)]">{flagIdentifier(config.countryFlag)}</span></div> : null}

      <PlateRegistration hasFlag={Boolean(flagAsset)} hasLogo={hasLogo} hasSlogan={hasSlogan} lineOne={lineOne} lineTwo={lineTwo} />

      {hasSlogan ? <div className="plate-slogan absolute inset-x-[13%] bottom-[7%] z-10 line-clamp-2 text-center text-[3.5cqw] leading-[1.05] text-[var(--plate-ink)]">{config.sloganText}</div> : null}

      {config.useType === "road-legal" ? <div aria-hidden className="absolute inset-x-[8%] bottom-[2.2%] z-10 flex items-end justify-between gap-3 text-[1.55cqw] font-semibold leading-none text-[var(--plate-ink)]"><span>License Plate Workshop Ltd RG1 6LB</span><span>BS AU 145e</span></div> : null}
    </div>
  );
}
