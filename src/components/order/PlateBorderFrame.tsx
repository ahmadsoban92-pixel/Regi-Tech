import type { BorderOption } from "@/types/order";

type PlateBorderFrameProps = {
  innerBorder: BorderOption;
  outerBorder: BorderOption;
  roadLegal?: boolean;
};

function materialClass(material: Exclude<BorderOption, "None">) {
  return material === "Mirror Silver" ? "plate-border-material-silver" : "plate-border-material-black";
}

export function PlateBorderFrame({ innerBorder, outerBorder, roadLegal = false }: PlateBorderFrameProps) {
  const hasInnerBorder = innerBorder !== "None";
  const hasOuterBorder = outerBorder !== "None";

  if (!hasInnerBorder && !hasOuterBorder) return null;

  if (!hasInnerBorder || !hasOuterBorder) {
    const material = (hasInnerBorder ? innerBorder : outerBorder) as Exclude<BorderOption, "None">;
    return (
      <span aria-hidden className={`plate-border-frame plate-border-frame-single plate-border-frame-${hasOuterBorder ? "outer" : "inner"} ${roadLegal ? "plate-border-frame-road-legal" : ""} ${materialClass(material)}`}>
        <span className="plate-border-cutout" />
      </span>
    );
  }

  if (innerBorder === outerBorder) {
    return (
      <span aria-hidden className={`plate-border-frame plate-border-frame-double plate-border-frame-double-same ${materialClass(innerBorder)}`}>
        <span className="plate-border-cutout" />
      </span>
    );
  }

  return (
    <span aria-hidden className={`plate-border-frame plate-border-frame-double plate-border-frame-double-mixed ${materialClass(outerBorder)}`}>
      <span className={`plate-border-band plate-border-band-inner ${materialClass(innerBorder)}`}>
        <span className="plate-border-cutout" />
      </span>
    </span>
  );
}
