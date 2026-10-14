import { CraftSection } from "@/components/home/CraftSection";
import { HomeClosingSection } from "@/components/home/HomeClosingSection";
import { HomeDetailsSection } from "@/components/home/HomeDetailsSection";
import { HomeFaqPreview } from "@/components/home/HomeFaqPreview";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeJourneySection } from "@/components/home/HomeJourneySection";
import { HomeProducts } from "@/components/home/HomeProducts";
import { PersonalStorySection } from "@/components/home/PersonalStorySection";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";

export default function HomePage() {
  return (
    <PageShell>
      <Reveal><HomeHero /></Reveal>
      <Reveal><HomeProducts /></Reveal>
      <Reveal><CraftSection /></Reveal>
      <Reveal><PersonalStorySection /></Reveal>
      <Reveal><HomeJourneySection /></Reveal>
      <Reveal><HomeDetailsSection /></Reveal>
      <Reveal><HomeFaqPreview /></Reveal>
      <Reveal><HomeClosingSection /></Reveal>
    </PageShell>
  );
}
