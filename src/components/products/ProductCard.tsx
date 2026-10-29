import Link from "next/link";
import type { Product } from "@/types/content";
import { ProductGallery } from "./ProductGallery";

export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  return (
    <article className="panel motion-card flex h-full flex-col overflow-hidden">
      <ProductGallery eager={eager} gallery={product.gallery} image={product.image} name={product.name} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-[1.35] text-[var(--foreground)]">{product.name}</h3>
          <span className="shrink-0 rounded-md border border-[var(--line)] bg-[var(--line)] px-2.5 py-1 text-[0.67rem] font-semibold text-[var(--label)]">{product.badge}</span>
        </div>
        <p className="mt-3 min-h-[4.4rem] text-sm leading-6 text-[var(--label)]">{product.description}</p>
        <div className="mt-auto flex items-end justify-between pt-5">
          <span className="text-sm text-[var(--muted)]">From</span>
          <strong className="text-xl text-[var(--foreground)]">{product.price}</strong>
        </div>
        <div className="mt-4">
          <Link className="primary-button min-h-10 w-full px-2 text-xs" href={`/design?product=${product.id}&new=1`}>Customise</Link>
        </div>
      </div>
    </article>
  );
}
