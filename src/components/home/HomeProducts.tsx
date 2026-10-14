import { ProductGrid } from "@/components/products/ProductGrid";
import content from "@/content/home.json";
import productData from "@/content/products.json";
import type { Product } from "@/types/content";

export function HomeProducts() {
  return (
    <section className="py-16 md:py-20">
      <div className="site-container">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow">{content.productsEyebrow}</p>
          <h2 className="section-heading mt-3">{content.productsTitle}</h2>
          <p className="mt-3 text-base text-[var(--label)]">{content.productsBody}</p>
        </div>
        <ProductGrid products={productData as Product[]} />
      </div>
    </section>
  );
}
