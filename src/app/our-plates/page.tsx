import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGrid } from "@/components/products/ProductGrid";
import content from "@/content/our-plates.json";
import productData from "@/content/products.json";
import type { Product } from "@/types/content";

export const metadata: Metadata = { title: content.title };

export default function OurPlatesPage() {
  return (
    <PageShell>
      <section className="py-12 md:py-16">
        <div className="site-container">
          <Breadcrumb current={content.breadcrumb} />
          <header className="mx-auto mt-10 max-w-2xl text-center">
            <h1 className="page-heading">{content.title}</h1>
            <p className="mt-4 text-base text-[var(--label)]">{content.body}</p>
          </header>
          <div className="mt-10 md:mt-12"><ProductGrid products={productData as Product[]} /></div>
        </div>
      </section>
    </PageShell>
  );
}
