"use client";

import Image from "next/image";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/Field";
import { LogoSymbol } from "@/components/ui/Logo";
import { useQuote } from "@/lib/quote-store";
import { useCopy } from "@/lib/locale-client";
import { formatNumber } from "@/lib/utils";

/**
 * The quote "cart". Slides from the end edge on desktop and up from the
 * bottom on mobile. Persisted through lib/quote-store.
 */
export function QuoteDrawer() {
  const copy = useCopy();
  const q = useQuote();
  const t = copy.quote;

  return (
    <Drawer
      open={q.isOpen}
      onClose={q.close}
      title={t.drawerTitle}
      footer={
        q.items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink/60">{t.drawerSummary}</span>
              <span className="mono-num font-display text-2xl">{formatNumber(q.totalBales)}</span>
            </div>
            <Button href="/quote" variant="ink" full onClick={q.close}>
              {t.drawerCta}
            </Button>
            <button
              type="button"
              onClick={q.close}
              className="link-line mx-auto block text-sm text-ink/60 hover:text-ink"
            >
              {t.drawerContinue}
            </button>
          </div>
        ) : undefined
      }
    >
      {q.items.length === 0 ? (
        <div className="flex h-full min-h-[40vh] flex-col items-center justify-center text-center">
          <LogoSymbol className="h-14 w-14 opacity-30" />
          <p className="display-xs mt-6">{t.drawerEmpty[0]}</p>
          <p className="mt-2 max-w-xs text-sm text-ink/60">{t.drawerEmpty[1]}</p>
          <Button href="/products" variant="outline-dark" size="sm" className="mt-8" onClick={q.close}>
            {t.drawerEmptyCta}
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-ink/10">
          {q.items.map((item) => (
            <li key={item.uid} className="flex gap-4 py-5">
              <Link
                href={`/products/${item.slug}`}
                onClick={q.close}
                className="graded relative block h-24 w-20 shrink-0 overflow-hidden bg-stone"
              >
                {item.image && (
                  <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow text-ink/60">{item.format}</p>
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={q.close}
                      className="mt-1 block font-display text-xl leading-tight hover:underline"
                    >
                      {item.name}
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => q.removeItem(item.uid)}
                    aria-label={`${copy.common.remove} ${item.name}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(v) => q.setQuantity(item.uid, v)}
                    size="sm"
                    label={`${copy.common.quantity} — ${item.name}`}
                  />
                  <span className="text-xs text-ink/60">{copy.common.bales}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
