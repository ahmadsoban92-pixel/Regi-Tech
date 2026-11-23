import Image from "next/image";
import home from "@/content/home.json";
import reviews from "@/content/reviews.json";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function HomeReviewsSection() {
  return (
    <section className="border-t border-[var(--line)] bg-[var(--background-deep)] py-16 md:py-20">
      <div className="site-container grid items-center gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
        <div>
          <p className="eyebrow">{home.reviewsEyebrow}</p>
          <h2 className="section-heading mt-3 max-w-xl">{home.reviewsTitle}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--label)]">{home.reviewsBody}</p>
          <ButtonLink className="mt-8" href="/reviews">{home.reviewsCta}</ButtonLink>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5" aria-label="Google and Trustpilot review QR codes">
          {reviews.platforms.map((platform) => (
            <div className="panel flex flex-col items-center p-3 text-center sm:p-5" key={platform.name}>
              <div className="w-full max-w-40 rounded-md bg-white p-2 sm:p-3">
                <Image alt={`${platform.name} review QR code`} className="aspect-square h-auto w-full" height={675} sizes="(max-width: 640px) 40vw, 160px" src={platform.image} unoptimized width={675} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{platform.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
