import Image from "next/image";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/types/product";
import { media } from "@/data/media";
import { getDictionary } from "@/lib/dictionary";
import { getCopy } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { pad2 } from "@/lib/utils";
import { visibleSpec } from "@/lib/demo-policy";

interface ProductCardProps {
  product: Product;
  index?: number;
  /** Compact variant for horizontal shelves. */
  variant?: "grid" | "shelf";
  priority?: boolean;
  className?: string;
  /** Heading level for the product name (2 on listing pages, 3 inside sections). */
  headingLevel?: 2 | 3;
}

/**
 * Product tile. No card chrome — a dominant photograph, an index, the
 * name, one line of fact and a single invitation.
 *
 * The visible metadata is deliberately thin (format · weight). The full
 * context — application, order type, availability — stays in the DOM as
 * a screen-reader-only description list so nothing is lost for assistive
 * technology or for search engines.
 */
export function ProductCard({ product, index, variant = "grid", priority, className, headingLevel = 3 }: ProductCardProps) {
  const copy = getCopy();
  const { labels } = getDictionary();
  const { format: formatLabels, application: applicationLabels, orderType: orderTypeLabels } = labels;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const primary = product.images[0];
  const img = primary ? media[primary] : undefined;
  const href = `/products/${product.slug}`;

  // One quiet line of fact instead of a metadata row. An unverified
  // weight is omitted in production rather than shown as a spec.
  const facts = [formatLabels[product.format], visibleSpec(product.weight)?.value]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn("group relative flex w-full flex-col", variant === "shelf" && "h-full", className)}
    >
      <Link
        href={href}
        className={cn(
          "img-zoom graded relative block overflow-hidden bg-stone",
          variant === "shelf" ? "aspect-[4/5]" : "aspect-[3/4] sm:aspect-[4/5]",
        )}
        aria-label={product.name}
      >
        {img && (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 78vw"
            className="object-cover"
          />
        )}
        {product.badge && (
          <span className="absolute end-4 top-4 z-[3] rounded-full bg-gold px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-ink">
            {product.badge}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 z-[3] h-1/3 bg-gradient-to-t from-ink/50 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden />
      </Link>

      <div className="flex flex-1 flex-col pt-5">
        {typeof index === "number" && <span className="eyebrow text-ink/60">{pad2(index + 1)}</span>}

        <Heading className={cn("display-sm", typeof index === "number" ? "mt-2.5" : "mt-0")}>
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </Heading>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/60">{product.tagline}</p>

        {facts && <p className="eyebrow mt-4 text-ink/60">{facts}</p>}

        {/* Full context, kept for assistive technology and crawlers. */}
        <dl className="sr-only">
          <dt>{copy.product.format}</dt>
          <dd>{formatLabels[product.format]}</dd>
          <dt>{copy.product.application}</dt>
          <dd>{product.application.map((a) => applicationLabels[a]).join(", ")}</dd>
          <dt>{copy.product.orderType}</dt>
          <dd>{product.orderType.map((o) => orderTypeLabels[o]).join(", ")}</dd>
          {visibleSpec(product.weight) && (
            <>
              <dt>{product.weight!.label}</dt>
              <dd>{product.weight!.value}</dd>
            </>
          )}
        </dl>

        <span
          className="eyebrow mt-auto inline-flex items-center gap-2 pt-6 text-ink transition-colors duration-500 group-hover:text-gold"
          aria-hidden
        >
          {copy.product.viewCta}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
            strokeWidth={1.75}
          />
        </span>
      </div>
    </article>
  );
}
