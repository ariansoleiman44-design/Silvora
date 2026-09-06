import { ProductCard } from "@/components/products/ProductCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { getCopy } from "@/lib/dictionary";
import type { Product } from "@/types/product";

export function RelatedProducts({ products }: { products: Product[] }) {
  const copy = getCopy();
  if (!products.length) return null;
  return (
    <section className="border-t border-ink/10 bg-cream-deep py-14 text-ink md:py-20">
      <div className="container-x">
        <Reveal>
          <Eyebrow className="mb-4">{copy.product.related}</Eyebrow>
        </Reveal>
        <RevealGroup
          as="ul"
          className="no-scrollbar -mx-[var(--gutter)] mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] scroll-ps-[var(--gutter)] pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0"
        >
          {products.map((p) => (
            <RevealItem as="li" key={p.id} className="flex w-[74vw] max-w-[20rem] shrink-0 snap-start md:w-auto md:max-w-none">
              <ProductCard product={p} variant="shelf" />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
