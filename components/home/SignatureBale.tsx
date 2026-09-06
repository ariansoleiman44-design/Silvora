"use client";

import { useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Reveal, RevealLines } from "@/components/ui/Reveal";

import { useCopy } from "@/lib/locale-client";
import { useQuote } from "@/lib/quote-store";
import { useDict } from "@/lib/locale-client";
import { cn, pad2 } from "@/lib/utils";
import { visibleSpecs } from "@/lib/demo-policy";
import type { SpecItem } from "@/types/product";

/**
 * Full-width dark feature for the flagship bale with an interactive
 * specification list: select a row to read how that part is built.
 */
export function SignatureBale() {
  const copy = useCopy();
  const t = copy.signature;
  const { products } = useDict();
  const product = products.find((p) => p.featured) ?? products[0]!;
  const quote = useQuote();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  // Unverified figures are dropped in production (lib/demo-policy.ts).
  const specs: SpecItem[] = visibleSpecs([
    product.weight,
    product.wrapping,
    product.chop,
    { label: "Intended livestock", value: product.bestFor[0] ?? "", demo: false },
    product.storage,
    product.minimumOrder,
    product.harvestOrigin,
    product.dimensions,
  ]);

  const details: Record<string, string> = {
    "Approx. weight": "Weight follows density and moisture. Heavier is not automatically better — consistent is.",
    Wrapping: "Layers of stretch film applied with overlap so no seam is exposed. The seal is what protects the ferment.",
    "Chop length": "Short and uniform. It packs tighter, ferments faster and mixes evenly into the ration.",
    "Intended livestock": "Built for daily feeding of dairy and beef herds; suitable for general livestock.",
    Storage: "Flat-end down on a clean, firm, well-drained base. Inspect the wrap and tape any puncture the day you see it.",
    "Minimum order": "Configurable per season and region. Tell us your quantity and we plan the loads.",
    "Harvest origin": "Set the growing region and season in data/products.ts so buyers know where the crop comes from.",
    Dimensions: "Sized for standard handlers and trailers. Confirm your equipment rating before delivery.",
  };

  const added = quote.lastAddedId === product.id;

  return (
    <section id="signature" className="cv-auto grain relative overflow-hidden bg-forest-deep text-cream">
      <div className="grid lg:grid-cols-12">
        {/* Image column */}
        <div className="relative lg:col-span-7 lg:min-h-[100svh]">
          <ImageFrame
            image="baleClose"
            className="aspect-[4/5] sm:aspect-[3/2] lg:absolute lg:inset-0 lg:aspect-auto"
            sizes="(min-width: 1024px) 58vw, 100vw"
            parallax={8}
            position="50% 72%"
            quality={75}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-deep via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-forest-deep" aria-hidden />
          <div className="absolute start-[var(--gutter)] top-8 lg:top-10">
            <span className="eyebrow rounded-full border border-cream/30 bg-ink/30 px-3 py-2 backdrop-blur-md">
              {product.badge ?? product.category}
            </span>
          </div>
        </div>

        {/* Text column */}
        <div className="relative z-10 px-[var(--gutter)] py-14 lg:col-span-5 lg:py-24 lg:pe-[var(--gutter)] lg:ps-12">
          <Reveal>
            <Eyebrow className="mb-6">{t.eyebrow}</Eyebrow>
          </Reveal>
          <RevealLines lines={t.headline} className="display-md uppercase" />
          <Reveal delay={0.15}>
            <p className="body-lg mt-6 max-w-md text-cream/65">{t.intro}</p>
          </Reveal>

          <Reveal delay={0.2} className="mt-10">
            <h3 className="eyebrow mb-3 text-cream/65">{t.specsTitle}</h3>
            <ul className="border-t border-cream/12" role="list">
              {specs.map((s, i) => {
                const isActive = active === i;
                return (
                  <li key={s.label} className="border-b border-cream/12">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-expanded={isActive}
                      className={cn(
                        "flex w-full flex-col items-start gap-1.5 py-4 text-start transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-4",
                        isActive ? "text-cream" : "text-cream/60 hover:text-cream",
                      )}
                    >
                      <span className="flex items-baseline gap-3">
                        <span className={cn("eyebrow", isActive ? "text-gold" : "text-cream/60")}>{pad2(i + 1)}</span>
                        <span className="text-sm font-medium tracking-wide">{s.label}</span>
                      </span>
                      <span className="mono-num ps-9 font-display text-lg leading-none sm:ps-0 sm:text-end">
                        {s.value}
                        {s.demo && (
                          <span className="ms-2 align-middle text-[0.5625rem] font-sans uppercase tracking-[0.18em] text-gold/80" title={copy.common.demoNote}>
                            {copy.common.demoLabel}
                          </span>
                        )}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <m.div
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-md pb-5 ps-9 text-sm leading-relaxed text-cream/60">
                            {details[s.label] ?? s.note ?? ""}
                          </p>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={0.25} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="gold"
              icon={added ? "none" : "arrow"}
              onClick={() => quote.addProduct(product, 1)}
              aria-live="polite"
            >
              {added ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> {copy.common.addedToQuote}
                </span>
              ) : (
                t.cta
              )}
            </Button>
            <Button href={`/products/${product.slug}`} variant="outline-light" icon="none">
              {t.secondary}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
