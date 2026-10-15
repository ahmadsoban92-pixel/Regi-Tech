import type { BorderOption } from "@/types/order";

type PlateBorderFrameProps = {
  innerBorder: BorderOption;
  outerBorder: BorderOption;
};

function materialClass(material: Exclude<BorderOption, "None">) {
  return material === "Mirror Silver" ? "plate-border-material-silver" : "plate-border-material-black";
}

export function PlateBorderFrame({ innerBorder, outerBorder }: PlateBorderFrameProps) {
  const hasInnerBorder = innerBorder !== "None";
  const hasOuterBorder = outerBorder !== "None";

  if (!hasInnerBorder && !hasOuterBorder) return null;

  if (!hasInnerBorder || !hasOuterBorder) {
    const material = (hasInnerBorder ? innerBorder : outerBorder) as Exclude<BorderOption, "None">;
    return <span aria-hidden className={`plate-border-frame plate-border-frame-single ${materialClass(material)}`} />;
  }

  return (
    <span aria-hidden className="plate-border-frame plate-border-frame-double">
      <span className={`plate-border-band plate-border-band-outer ${materialClass(outerBorder)}`} />
      <span className={`plate-border-band plate-border-band-inner ${materialClass(innerBorder)}`} />
    </span>
  );
}
