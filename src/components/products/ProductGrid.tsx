import type { Product } from "@/types/content";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product, index) => (
        <Reveal className="h-full" delay={index * 0.06} key={product.id}>
          <ProductCard eager={index === 0} product={product} />
        </Reveal>
      ))}
    </div>
  );
}
