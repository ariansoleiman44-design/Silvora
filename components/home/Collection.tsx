import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/products/ProductCard";
import { getDictionary } from "@/lib/dictionary";

import { getCopy } from "@/lib/dictionary";

/**
 * Homepage product shelf: six formats. Horizontal snap scroll on mobile
 * (an intentional shelf, not a stack), a three-column grid on desktop.
 */
export function Collection() {
  const copy = getCopy();
  const { products } = getDictionary();
  const t = copy.collection;
  const shelf = products.filter((p) => p.format !== "custom").slice(0, 6);

  return (
    <section id="collection" className="cv-auto section-y bg-cream text-ink">
      <div className="container-x">
        <SectionHeader
          eyebrow={t.eyebrow}
          lines={t.headline}
          intro={t.intro}
        />
      </div>

      <RevealGroup
        as="ul"
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] scroll-ps-[var(--gutter)] pb-2 md:mt-16 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14 lg:overflow-visible"
        amount={0.1}
      >
        {shelf.map((p, i) => (
          <RevealItem
            as="li"
            key={p.id}
            className="flex w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-[46vw] lg:w-auto lg:max-w-none"
          >
            {/* No priority: this shelf is below the fold, and preloading two
                cards put 122 KB on the LCP path — 1.4x the hero itself on a
                phone — competing with the image that actually is the LCP. */}
            <ProductCard product={p} index={i} variant="shelf" />
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="container-x mt-12 flex justify-center md:mt-16">
        <Button href="/products" variant="outline-dark" size="lg">
          {t.cta}
        </Button>
      </div>
    </section>
  );
}
