import type { Metadata } from "next";
import { PlateConfigurator } from "@/components/configurator/PlateConfigurator";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Design Your Plate" };

export default async function DesignPage({ searchParams }: { searchParams: Promise<{ product?: string; new?: string }> }) {
  const { product = "hand-crafted-show-plate", new: newDesign } = await searchParams;
  return <PageShell><PlateConfigurator productId={product} startFresh={newDesign === "1"} /></PageShell>;
}
