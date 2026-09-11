"use client";

import Image from "next/image";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { Bookmark, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useQuote } from "@/lib/quote-store";
import { searchProducts } from "@/lib/search";
import { track } from "@/lib/analytics";

import { media } from "@/data/media";
import { siteConfig } from "@/data/site-config";
import { useCopy, useDict } from "@/lib/locale-client";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * SEARCH + SHORTLIST
 * --------------------------------------------------------------------
 * One overlay does both jobs, because they are the same job: finding the
 * bale you want. With an empty query it shows the products you saved;
 * typing replaces them with matches. No backend, no index, no accounts.
 *
 * Own overlay rather than the shared Drawer: this one is a top sheet,
 * focuses its input on mount and closes on Escape. The parent mounts it
 * only while open, so the query resets by unmounting rather than by an
 * effect that writes state during render.
 */
export function ProductSearch({ onClose }: { onClose: () => void }) {
  const copy = useCopy();
  const t = copy.search;
  const q = useQuote();
  const { products, labels } = useDict();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  const results = useMemo(
    () => searchProducts(query, { products, labels }),
    [query, products, labels],
  );
  const savedProducts = useMemo(
    () => q.saved.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)),
    [q.saved, products],
  );

  /*
   * Tab cycling and focus restoration. This declared role="dialog"
   * aria-modal="true" but did neither: Tab walked straight out into the
   * page behind the overlay, and closing dumped focus at the top of the
   * document instead of back on the header's Search button.
   *
   * autoFocus is off because the search input is focused below — the
   * hook would otherwise grab the first focusable element, which is the
   * close button.
   */
  // Always true: the parent mounts this only while open.
  useFocusTrap(true, panelRef, onClose, { autoFocus: false });

  useEffect(() => {
    // A beat, so the opening animation does not fight the caret.
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (query.trim().length >= 2 && !trackedRef.current) {
      trackedRef.current = true;
      track("search_used");
    }
  }, [query]);

  const showing = query.trim() ? results : savedProducts;
  const isSavedView = !query.trim();

  return (
    <div className="fixed inset-0 z-[85]">
      <button
        type="button"
        aria-label={copy.common.close}
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="absolute inset-x-0 top-0 max-h-[92dvh] overflow-y-auto bg-cream text-ink shadow-2xl shadow-ink/30"
      >
        <div className="container-x py-5 md:py-7">
          <div className="flex items-center gap-3 border-b border-ink/20 pb-3">
            <Search className="h-5 w-5 shrink-0 text-ink/60" strokeWidth={1.5} aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.title}
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base outline-none placeholder:text-ink/35"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.common.close}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink/15 transition-colors hover:bg-ink/5"
            >
              <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </button>
          </div>

          <p className="eyebrow mt-5 text-ink/60">
            {isSavedView ? copy.product.savedTitle : `${t.results} · ${showing.length}`}
          </p>

          {showing.length === 0 ? (
            <p className="mt-4 pb-4 text-sm text-ink/60">
              {isSavedView ? copy.product.savedEmpty : t.empty}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
              {showing.map((p) => {
                const img = p.images[0] ? media[p.images[0]] : undefined;
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
                    <Link
                      href={`/products/${p.slug}`}
                      onClick={onClose}
                      className="graded relative block h-16 w-14 shrink-0 overflow-hidden bg-stone"
                      aria-hidden
                      tabIndex={-1}
                    >
                      {img && <Image src={img.src} alt="" fill sizes="56px" className="object-cover" />}
                    </Link>
                    <div className="min-w-0 flex-1 basis-40">
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={onClose}
                        className="link-line font-display text-lg leading-tight"
                      >
                        {p.name}
                      </Link>
                      <p className="mt-0.5 truncate text-xs uppercase tracking-[0.14em] text-ink/60">
                        {p.category}
                      </p>
                    </div>
                    <div className="ms-auto flex shrink-0 items-center gap-1">
                      {siteConfig.features.savedProductsEnabled && (
                        <button
                          type="button"
                          onClick={() => q.toggleSaved(p.id)}
                          aria-pressed={q.isSaved(p.id)}
                          aria-label={`${q.isSaved(p.id) ? copy.product.saved : copy.product.save} — ${p.name}`}
                          className={cn(
                            "grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-ink/5",
                            q.isSaved(p.id) ? "text-gold" : "text-ink/60",
                          )}
                        >
                          <Bookmark
                            className={cn("h-4 w-4", q.isSaved(p.id) && "fill-current")}
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        </button>
                      )}
                      <Button
                        variant="outline-dark"
                        size="sm"
                        icon="none"
                        onClick={() => q.addProduct(p, 10, { open: false })}
                      >
                        {copy.product.savedAddAll}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-5 hidden text-xs text-ink/60 md:block">{t.hint}</p>
        </div>
      </div>
    </div>
  );
}
