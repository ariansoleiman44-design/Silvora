"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useQuote } from "@/lib/quote-store";
import { useScrolled } from "@/lib/hooks";
import { track } from "@/lib/analytics";
import { useCopy } from "@/lib/locale-client";
import type { Product } from "@/types/product";

/**
 * Sticky thumb-reach bar on product pages (mobile / tablet only).
 *
 * It is the ONLY persistent action area on this page: the site-wide
 * quote bar excludes product routes, and this bar hides itself while the
 * quote drawer is open. Its hierarchy mirrors the desktop panel — add is
 * primary, reviewing the request is secondary.
 */
export function MobileBuyBar({ product }: { product: Product }) {
  const copy = useCopy();
  const quote = useQuote();
  const reduce = useReducedMotion();
  const scrolled = useScrolled(320);
  const added = quote.lastAddedId === product.id;
  const show = scrolled && !quote.isOpen;

  return (
    <AnimatePresence>
      {show && (
        <m.div
          className="fixed inset-x-0 bottom-0 z-[50] border-t border-cream/10 bg-ink/90 backdrop-blur-xl lg:hidden"
          initial={reduce ? false : { y: "100%" }}
          animate={{ y: 0 }}
          exit={reduce ? undefined : { y: "100%" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="grid grid-cols-2 gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => {
                quote.addProduct(product, 10);
                track("product_add_to_quote", { product: product.slug, quantity: 10, source: "mobile-bar" });
              }}
              className="inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-[2px] bg-gold text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink"
              aria-live="polite"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> {copy.common.addedToQuote}
                </>
              ) : (
                copy.product.addToRequest
              )}
            </button>
            <button
              type="button"
              onClick={quote.open}
              className="h-[3.25rem] rounded-[2px] border border-cream/30 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-cream"
            >
              {copy.product.stickyQuote}
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
