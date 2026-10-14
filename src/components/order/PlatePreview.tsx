import Image from "next/image";
import type { PlateConfiguration } from "@/types/order";
import { PlateRegistration } from "@/components/order/PlateRegistration";

function splitRegistration(registration: string): [string, string] {
  const normalized = registration.trim().toUpperCase().replace(/\s+/g, " ");
  if (!normalized) return ["YOUR", "REJ"];
  const parts = normalized.split(" ");
  if (parts.length > 1) return [parts.slice(0, -1).join(" "), parts.at(-1) ?? ""];
  const midpoint = Math.ceil(normalized.length / 2);
  return [normalized.slice(0, midpoint), normalized.slice(midpoint)];
}

export function PlatePreview({ compact = false, config }: { compact?: boolean; config: PlateConfiguration }) {
  const [lineOne, lineTwo] = splitRegistration(config.registration);
  const showOuter = config.outerBorder !== "None";
  const showInner = config.innerBorder !== "None";

  return (
    <div className={`plate-canvas relative mx-auto aspect-[203/153] w-full overflow-hidden ${compact ? "max-w-[155px]" : "max-w-[527px]"}`}>
      <Image alt="Personalised motorcycle plate preview" className="object-fill" fill sizes={compact ? "155px" : "(max-width: 767px) calc(100vw - 80px), 527px"} src="/assets/regitech/plate-preview-base.svg" />
      {showOuter ? <Image alt="" aria-hidden className={`pointer-events-none absolute inset-[1.6%_1.25%] h-[96.8%] w-[97.5%] ${config.outerBorder === "Mirror Silver" ? "opacity-60" : ""}`} height={405} src="/assets/regitech/plate-preview-outer.svg" width={535} /> : null}
      {showInner ? <Image alt="" aria-hidden className={`pointer-events-none absolute inset-[4%_3%] h-[92%] w-[94%] ${config.innerBorder === "Mirror Silver" ? "opacity-60" : ""}`} height={390} src="/assets/regitech/plate-preview-inner.svg" width={505} /> : null}
      {config.logo === "BMW" ? (
        <Image alt="BMW logo" className="absolute left-1/2 top-[5%] h-auto w-[8%] -translate-x-1/2" height={64} src="/assets/regitech/logo-bmw.png" width={64} />
      ) : config.logo !== "No Logo" ? (
        <span className="absolute left-1/2 top-[5%] -translate-x-1/2 text-[3cqw] font-bold text-[var(--foreground-on-light)]">{config.logo}</span>
      ) : null}
      <PlateRegistration lineOne={lineOne} lineTwo={lineTwo} />
      {config.sloganEnabled ? (
        <div className="plate-slogan absolute inset-x-[18%] bottom-[3.6%] truncate text-center text-[3cqw] text-[var(--foreground-on-light)]">{config.sloganText}</div>
      ) : null}
    </div>
  );
}
