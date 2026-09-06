"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import { useEffect } from "react";

import { siteConfig } from "@/data/site-config";
import { isWhatsappConfigured, whatsappHref } from "@/lib/contact";
import { useCopy } from "@/lib/locale-client";
import { Button } from "@/components/ui/Button";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { useDict } from "@/lib/locale-client";
import { cn, pad2 } from "@/lib/utils";

/**
 * Full-screen mobile navigation. Dark, editorial, thumb-friendly.
 */
export function MobileMenu({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch?: () => void;
}) {
  const copy = useCopy();
  const mainNav = useDict().nav.main;
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={copy.common.menu}
          className="grain fixed inset-0 z-[55] flex flex-col bg-ink text-cream lg:hidden"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="pointer-events-none absolute inset-0 field-rows text-cream opacity-40" aria-hidden />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-[var(--gutter)] pt-[5.5rem] pb-8">
            {siteConfig.features.searchEnabled && onSearch && (
              <button
                type="button"
                onClick={onSearch}
                className="mb-6 flex min-h-14 w-full items-center gap-3 rounded-[2px] border border-cream/20 px-4 text-start text-sm text-cream/70 transition-colors hover:border-cream/50 hover:text-cream"
              >
                <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                {copy.search.placeholder}
              </button>
            )}

            <nav aria-label="Mobile">
              <ul className="divide-y divide-cream/10 border-y border-cream/10">
                {mainNav.map((item, i) => (
                  <m.li
                    key={item.href}
                    initial={reduce ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.08 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="group flex items-center justify-between gap-4 py-4"
                    >
                      <span className="flex items-baseline gap-4">
                        <span className="eyebrow text-gold">{pad2(i + 1)}</span>
                        <span className="flex flex-col">
                          <span className="font-display text-[2rem] leading-none tracking-tight xs:text-[2.25rem]">
                            {item.label}
                          </span>
                          {item.hint && (
                            <span className="mt-1.5 text-xs text-cream/65">{item.hint}</span>
                          )}
                        </span>
                      </span>
                      <ArrowUpRight
                        className="h-5 w-5 shrink-0 text-cream/60 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 group-hover:text-gold"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </Link>
                  </m.li>
                ))}
              </ul>
            </nav>

            <m.div
              className="mt-8 flex flex-col gap-5"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Button href="/quote" variant="gold" full onClick={onClose}>
                {copy.common.requestQuote}
              </Button>
              <div className={cn("grid gap-3", isWhatsappConfigured() ? "grid-cols-2" : "grid-cols-1")}>
                {isWhatsappConfigured() && (
                  <Button
                    href={whatsappHref()}
                    variant="outline-light"
                    icon="external"
                    size="sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {copy.common.whatsapp}
                  </Button>
                )}
                <Button href="/contact" variant="outline-light" size="sm" icon="none" onClick={onClose}>
                  {copy.common.talkToSales}
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4 border-t border-cream/10 pt-5 text-xs text-cream/60">
                <span className="truncate">{siteConfig.contact.email}</span>
                <LanguageSwitch />
              </div>
            </m.div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
