"use client";

import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { media, type MediaKey } from "@/data/media";
import { scrollOffset, scrollToOffset } from "@/lib/rtl";
import { useCopy } from "@/lib/locale-client";
import { cn, pad2 } from "@/lib/utils";

/**
 * Product gallery.
 *  - Mobile: swipeable snap carousel with counter and dots.
 *  - Desktop: dominant main image with a thumbnail rail and a slow
 *    zoom on hover.
 */
export function ProductGallery({ images, name }: { images: MediaKey[]; name: string }) {
  const copy = useCopy();
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  const assets = images.map((k) => media[k]);

  // Track the active slide on mobile.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // scrollLeft is negative in RTL — see lib/rtl.ts.
        const i = Math.round(scrollOffset(el) / el.clientWidth);
        setIndex(Math.max(0, Math.min(assets.length - 1, i)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [assets.length]);

  const goTo = (i: number) => {
    setIndex(i);
    const el = trackRef.current;
    // scrollTo takes a PHYSICAL offset, which is negative in RTL — a
    // positive value is clamped to 0, so every dot jumped to slide one.
    if (el) {
      el.scrollTo({
        left: scrollToOffset(el, i * el.clientWidth),
        behavior: reduce ? "auto" : "smooth",
      });
    }
  };

  const active = assets[index] ?? assets[0];

  return (
    <div>
      {/* Mobile carousel */}
      <div className="relative lg:hidden">
        <ul
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`${name} — ${copy.product.gallery}`}
        >
          {assets.map((a, i) => (
            <li key={i} className="graded relative aspect-[4/5] w-full shrink-0 snap-center bg-soil md:aspect-[4/3]">
              <Image
                src={a.src}
                alt={a.alt}
                fill
                // The mobile track stays in the DOM at desktop widths
                // (hidden with lg:hidden), so `sizes` must describe both
                // or Next warns about over-fetching.
                sizes="(min-width: 1024px) 52vw, 100vw"
                priority={i === 0}
                className="object-cover"
              />
            </li>
          ))}
        </ul>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-5 pb-5">
          <span className="mono-num eyebrow rounded-full bg-ink/50 px-3 py-2 text-cream backdrop-blur-md">
            {pad2(index + 1)} / {pad2(assets.length)}
          </span>
          <div className="pointer-events-auto flex gap-1.5" role="tablist" aria-label={copy.product.gallery}>
            {assets.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${copy.product.gallery} ${i + 1}`}
                onClick={() => goTo(i)}
                className="grid h-8 w-6 place-items-center"
              >
                <span className={cn("block h-1.5 w-1.5 rounded-full transition-all", i === index ? "w-5 bg-gold" : "bg-cream/60")} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[5rem_1fr]">
        <ul className="flex flex-col gap-3" role="tablist" aria-label={copy.product.gallery}>
          {assets.map((a, i) => (
            <li key={i}>
              <button
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${copy.product.gallery} ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "graded relative block aspect-[4/5] w-full overflow-hidden border transition-colors",
                  i === index ? "border-gold" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Image src={a.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
        <div className="img-zoom graded relative aspect-[4/5] overflow-hidden bg-soil xl:aspect-[5/6]">
          <AnimatePresence mode="sync" initial={false}>
            <m.div
              key={index}
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {active && (
                <Image
                  src={active.src}
                  alt={active.alt}
                  fill
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  priority={index === 0}
                  quality={85}
                  className="object-cover"
                />
              )}
            </m.div>
          </AnimatePresence>
          <span className="mono-num eyebrow absolute bottom-5 start-5 rounded-full bg-ink/50 px-3 py-2 text-cream backdrop-blur-md">
            {pad2(index + 1)} / {pad2(assets.length)}
          </span>
        </div>
      </div>
    </div>
  );
}
