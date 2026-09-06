"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useScrolled } from "@/lib/hooks";
import { useQuote } from "@/lib/quote-store";
import { Button } from "@/components/ui/Button";
import { isWhatsappConfigured, whatsappHref } from "@/lib/contact";
import { useCopy } from "@/lib/locale-client";

/**
 * Thumb-reach action bar on mobile. Appears after the hero on content
 * pages; product pages render their own buy bar instead.
 */
export function MobileQuoteBar() {
  const copy = useCopy();
  const pathname = usePathname();
  const scrolled = useScrolled(560);
  const quote = useQuote();
  const reduce = useReducedMotion();

  const isProductPage = /^\/products\/[^/]+$/.test(pathname);
  const isQuotePage = pathname === "/quote";
  const show = scrolled && !quote.isOpen && !isProductPage && !isQuotePage;

  return (
    <AnimatePresence>
      {show && (
        <m.div
          className="fixed inset-x-0 bottom-0 z-[50] border-t border-cream/10 bg-ink/90 backdrop-blur-xl pb-safe md:hidden"
          initial={reduce ? false : { y: "100%" }}
          animate={{ y: 0 }}
          exit={reduce ? undefined : { y: "100%" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Button href="/quote" variant="gold" full icon="none" className="flex-1">
              {copy.common.requestQuote}
            </Button>
            {isWhatsappConfigured() && (
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.common.whatsapp}
                className="grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center rounded-[2px] border border-cream/25 text-cream"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </a>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
