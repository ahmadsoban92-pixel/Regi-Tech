import Image from "next/image";
import { Check } from "lucide-react";
import content from "@/content/home.json";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function HomeDetailsSection() {
  return (
    <section className="bg-[var(--light-panel)] py-16 text-[var(--foreground-on-light)] md:py-20">
      <div className="site-container grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="rounded-lg bg-[var(--foreground)] p-5">
          <Image alt="Personalised AB76 BCD plate" className="h-auto w-full" height={600} src="/assets/regitech/plate-handcrafted.png" width={760} />
        </div>
        <div>
          <h2 className="section-heading">{content.detailsTitle}</h2>
          <p className="mt-4 text-base text-[var(--foreground-on-light-muted)]">{content.detailsBody}</p>
          <ul className="mt-7 space-y-4">
            {content.detailsPoints.map((point) => <li className="flex items-center gap-3 font-medium" key={point}><Check aria-hidden className="text-[var(--accent-muted)]" size={20} />{point}</li>)}
          </ul>
          <ButtonLink className="mt-8" href="/design">{content.detailsCta}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
