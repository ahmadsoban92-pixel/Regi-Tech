import Image from "next/image";
import content from "@/content/home.json";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PlateRegistration } from "@/components/order/PlateRegistration";

export function CraftSection() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--background-deep)] py-16 md:py-24">
      <div className="site-container grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-9">
        <div className="grid min-w-0 grid-cols-2 gap-3 overflow-hidden sm:gap-4">
          <div className="panel col-span-2 p-4 sm:p-8">
            <div className="plate-canvas relative aspect-[598/452] overflow-hidden">
              <Image alt="Hand-crafted AB76 BCD motorcycle plate" className="object-fill" fill sizes="(max-width: 1023px) calc(100vw - 64px), 55vw" src="/assets/regitech/craft-plate-main.svg" />
              <Image alt="" aria-hidden className="pointer-events-none absolute inset-[4%_3%] h-[92%] w-[94%]" height={420} src="/assets/regitech/craft-outline-main.svg" width={567} />
              <PlateRegistration lineOne="AB76" lineTwo="BCD" />
            </div>
          </div>
          <div className="panel relative aspect-square overflow-hidden">
            <div className="absolute -left-[64%] -top-[49%] w-[225%]">
              <div className="plate-canvas relative aspect-[742/560]">
                <Image alt="Close-up of AB76 BCD plate lettering" className="object-fill" fill sizes="55vw" src="/assets/regitech/craft-plate-crop-left.svg" />
                <Image alt="" aria-hidden className="pointer-events-none absolute inset-[4%_3%] h-[92%] w-[94%]" height={521} src="/assets/regitech/craft-outline-left.svg" width={703} />
                <PlateRegistration lineOne="AB76" lineTwo="BCD" />
              </div>
            </div>
          </div>
          <div className="panel relative aspect-square overflow-hidden">
            <div className="absolute -left-[16%] -top-[14%] w-[255%]">
              <div className="plate-canvas relative aspect-[839/633]">
                <Image alt="Close-up of the hand-crafted plate edge" className="object-fill" fill sizes="55vw" src="/assets/regitech/craft-plate-crop-right.svg" />
                <Image alt="" aria-hidden className="pointer-events-none absolute inset-[4%_3%] h-[92%] w-[94%]" height={589} src="/assets/regitech/craft-outline-right.svg" width={795} />
                <PlateRegistration lineOne="AB76" lineTwo="BCD" />
              </div>
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
