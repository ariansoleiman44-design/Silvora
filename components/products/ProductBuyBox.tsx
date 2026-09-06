"use client";

import { Bookmark, Check, FileText, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/Field";
import { AvailabilityBadge } from "@/components/products/AvailabilityBadge";
import { SpecDrawer } from "@/components/products/SpecDrawer";
import { useQuote } from "@/lib/quote-store";
import { track } from "@/lib/analytics";
import { useDict } from "@/lib/locale-client";
import { siteConfig } from "@/data/site-config";
import { isPhoneConfigured, isWhatsappConfigured, telHref, whatsappHref } from "@/lib/contact";
import { useCopy } from "@/lib/locale-client";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * Product panel.
 *
 * CTA hierarchy is deliberately steep — four equal buttons is how a
 * premium page starts looking like a marketplace listing:
 *
 *   Primary    Add to request      (gold)
 *   Secondary  View specification  (outline)
 *   Utility    Save · Call · WhatsApp   (quiet text row)
 *
 * WhatsApp is absent, not disabled, until a real number is configured.
 */
export function ProductBuyBox({ product }: { product: Product }) {
  const copy = useCopy();
  const { labels } = useDict();
  const { format: formatLabels, application: applicationLabels, orderType: orderTypeLabels } = labels;
  const quote = useQuote();
  const [qty, setQty] = useState(10);
  const [specOpen, setSpecOpen] = useState(false);
  const t = copy.product;
  const added = quote.lastAddedId === product.id;
  const inRequest = quote.has(product.id);
  const saved = quote.isSaved(product.id);

  const waText = `Hello ${siteConfig.brandNameDisplay}, I'd like a quote for ${qty} × ${product.name}.`;

  const utility =
    "inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cream/70 transition-colors hover:text-cream";

  return (
    <div className="flex flex-col">
      <p className="eyebrow text-gold">{product.category}</p>
      <h1 className="display-lg mt-4">{product.name}</h1>
      <p className="mt-4 max-w-md font-display text-2xl italic leading-snug text-wheat/90">{product.tagline}</p>

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-cream/12 py-6 text-sm sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="eyebrow text-cream/65">{t.format}</dt>
          <dd className="mt-1.5 text-cream">{formatLabels[product.format]}</dd>
        </div>
        <div>
          <dt className="eyebrow text-cream/65">{t.application}</dt>
          <dd className="mt-1.5 text-cream">{product.application.map((a) => applicationLabels[a]).join(", ")}</dd>
        </div>
        <div>
          <dt className="eyebrow text-cream/65">{t.orderType}</dt>
          <dd className="mt-1.5 text-cream">{product.orderType.map((o) => orderTypeLabels[o]).join(", ")}</dd>
        </div>
        <div>
          <dt className="eyebrow text-cream/65">{t.availability}</dt>
          <dd className="mt-1.5">
            <AvailabilityBadge product={product} />
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div>
          <p className="eyebrow mb-2 text-cream/65">
            {copy.common.quantity} · {copy.common.bales}
          </p>
          <QuantityStepper value={qty} onChange={setQty} tone="dark" />
        </div>
        {product.minimumOrder && (
          <p className="text-xs text-cream/65">
            {product.minimumOrder.label}: {product.minimumOrder.value}
          </p>
        )}
      </div>

      {/* Primary */}
      <Button
        variant="gold"
        size="lg"
        className="mt-8"
        icon={added ? "none" : "arrow"}
        onClick={() => {
          quote.addProduct(product, qty);
          track("product_add_to_quote", { product: product.slug, quantity: qty });
        }}
        aria-live="polite"
      >
        {added ? (
          <span className="inline-flex items-center gap-2">
            <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> {copy.common.addedToQuote}
          </span>
        ) : inRequest ? (
          t.inRequest
        ) : (
          t.addToRequest
        )}
      </Button>

      {/* Secondary */}
      <Button
        variant="outline-light"
        size="lg"
        icon="none"
        className="mt-3"
        onClick={() => setSpecOpen(true)}
      >
        <FileText className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        {t.viewSpec}
      </Button>

      {/* Utility */}
      <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-1 border-t border-cream/12 pt-5">
        {siteConfig.features.savedProductsEnabled && (
          <button
            type="button"
            onClick={() => {
              quote.toggleSaved(product.id);
              if (!saved) track("product_save", { product: product.slug });
            }}
            aria-pressed={saved}
            className={cn(utility, saved && "text-gold hover:text-gold-light")}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} strokeWidth={1.5} aria-hidden />
            {saved ? t.saved : t.save}
          </button>
        )}
        {isPhoneConfigured() && (
          <a href={telHref()} className={utility}>
            <Phone className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            {copy.common.callSales}
          </a>
        )}
        {isWhatsappConfigured() && (
          <a
            href={whatsappHref(waText)}
            target="_blank"
            rel="noopener noreferrer"
            className={utility}
            onClick={() => track("whatsapp_click", { product: product.slug })}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            {copy.common.whatsapp}
          </a>
        )}
      </div>

      <SpecDrawer product={product} open={specOpen} onClose={() => setSpecOpen(false)} />
    </div>
  );
}
