import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { OrderReview } from "@/components/review/OrderReview";

export const metadata: Metadata = { title: "Review Your Plate" };

export default function ReviewPage() {
  return <PageShell><OrderReview /></PageShell>;
}
