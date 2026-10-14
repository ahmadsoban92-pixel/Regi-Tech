import Image from "next/image";
import content from "@/content/home.json";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function PersonalStorySection() {
  return (
    <section className="py-16 md:py-24">
      <div className="site-container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <p className="eyebrow">{content.storyEyebrow}</p>
          <h2 className="section-heading mt-3">{content.storyTitle}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--label)]">{content.storyBody}</p>
          <ButtonLink className="mt-8" href="/design">{content.storyCta}</ButtonLink>
        </div>
        <Image alt="Motorcycle ride through the mountains" className="order-1 h-[320px] w-full rounded-lg object-cover lg:order-2 lg:h-[440px]" height={760} src="/assets/regitech/hero.png" width={900} />
      </div>
    </section>
  );
}
