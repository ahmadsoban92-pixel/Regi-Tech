import type { Metadata } from "next";
import { PlateConfigurator } from "@/components/configurator/PlateConfigurator";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Design Your Plate" };

export default async function DesignPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product = "hand-crafted-show-plate" } = await searchParams;
  return <PageShell><PlateConfigurator productId={product} /></PageShell>;
}
