import Image from "next/image";
import content from "@/content/home.json";
import { PlatePreview } from "@/components/order/PlatePreview";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { createDefaultConfiguration } from "@/lib/productCatalog";
import type { PlateConfiguration } from "@/types/order";

const showcasePlate: PlateConfiguration = {
  ...createDefaultConfiguration("hand-crafted-show-plate", "AB76 BCD"),
  size: "6×8″",
  innerBorder: "Black",
};

export function CraftSection() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--background-deep)] py-16 md:py-24">
      <div className="site-container grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-9">
        <div className="grid min-w-0 grid-cols-2 gap-3 overflow-hidden sm:gap-4">
          <div className="panel col-span-2 p-4 sm:p-8">
            <span className="sr-only">Hand-crafted AB76 BCD motorcycle plate</span>
            <PlatePreview config={showcasePlate} fluid />
          </div>
          <div className="panel relative aspect-square overflow-hidden">
            <span className="sr-only">Close-up of AB76 BCD plate lettering</span>
            <div className="absolute -left-[64%] -top-[48%] w-[230%]">
              <PlatePreview config={showcasePlate} fluid />
            </div>
          </div>
          <div className="panel relative aspect-square overflow-hidden">
            <span className="sr-only">Close-up of the hand-crafted plate edge</span>
            <div className="absolute -left-[18%] -top-[14%] w-[255%]">
              <PlatePreview config={showcasePlate} fluid />
            </div>
          </div>
        </div>
        <div>
          <p className="eyebrow">{content.craftEyebrow}</p>
          <h2 className="section-heading mt-3">{content.craftTitle}</h2>
          <p className="mt-5 text-base leading-7 text-[var(--label)]">{content.craftBody}</p>
          <div className="mt-7 space-y-5">
            {content.craftFeatures.map((feature) => (
              <div className="flex gap-4" key={feature.title}>
                <div className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)]">
                  <Image alt="" aria-hidden height={18} src={feature.icon} width={18} />
                </div>
                <div><h3 className="font-semibold">{feature.title}</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{feature.body}</p></div>
              </div>
            ))}
          </div>
          <ButtonLink className="mt-8" href="/our-plates#hand-crafted-show-plate">{content.craftCta}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
