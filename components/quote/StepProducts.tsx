"use client";

import Image from "next/image";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup, QuantityStepper, SelectField, TextArea, TextField } from "@/components/ui/Field";
import { useQuote } from "@/lib/quote-store";

import { useCopy } from "@/lib/locale-client";
import { formatNumber } from "@/lib/utils";
import type { SupplyFrequency, SupplyMode } from "@/types/quote";
import { FIELD_LIMITS } from "@/lib/form-limits";

/**
 * Step 1 — the basket, upgraded into order lines: quantity, an optional
 * per-line cadence, a note, duplicate and remove. Then the supply shape
 * for the request as a whole.
 *
 * No price is ever computed. The pricing panel says what actually
 * decides a price instead of showing a number we cannot stand behind.
 */
export function StepProducts() {
  const copy = useCopy();
  const frequencyLabels = copy.rfq.frequencies;
  const q = useQuote();
  const t = copy.rfq.products;
  const [openNotes, setOpenNotes] = useState<string | null>(null);

  const frequencyOptions = (Object.keys(frequencyLabels) as SupplyFrequency[]).map((k) => ({
    value: k,
    label: frequencyLabels[k],
  }));

  return (
    <div>
      <h2 className="display-sm">{t.title}</h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/65">{t.intro}</p>

      {q.items.length === 0 ? (
        <div className="mt-8 border border-dashed border-ink/20 p-6 text-sm text-ink/65">
          <p>{t.empty}</p>
          <Link href="/products" className="link-line mt-4 inline-block font-medium text-ink">
            {t.browse}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 border-t border-ink/12">
          {q.items.map((item) => {
            const notesOpen = openNotes === item.uid || Boolean(item.notes);
            return (
              <li key={item.uid} className="border-b border-ink/12 py-5">
                <div className="flex gap-4">
                  <Link
                    href={`/products/${item.slug}`}
                    className="graded relative block h-24 w-20 shrink-0 overflow-hidden bg-stone"
                    aria-label={item.name}
                  >
                    {item.image && <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="eyebrow text-ink/60">{item.format}</p>
                        <p className="mt-1 font-display text-xl leading-tight">{item.name}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          href={`/products/${item.slug}`}
                          aria-label={`${copy.rfq.edit} — ${item.name}`}
                          className="grid h-10 w-10 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => q.duplicateItem(item.uid)}
                          aria-label={`${t.duplicate} — ${item.name}`}
                          className="grid h-10 w-10 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                        >
                          <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => q.removeItem(item.uid)}
                          aria-label={`${t.remove} — ${item.name}`}
                          className="grid h-10 w-10 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(v) => q.setQuantity(item.uid, v)}
                        size="sm"
                        label={`${copy.common.quantity} — ${item.name}`}
                      />
                      <span className="text-xs text-ink/60">{copy.common.bales}</span>
                      {!notesOpen && (
                        <button
                          type="button"
                          onClick={() => setOpenNotes(item.uid)}
                          className="link-line ms-auto text-xs text-ink/60 hover:text-ink"
                        >
                          + {t.notes}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {(notesOpen || q.request.supplyMode === "recurring") && (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:ps-24">
                    {q.request.supplyMode === "recurring" && (
                      <SelectField
                        label={t.lineFrequency}
                        value={item.frequency ?? ""}
                        onChange={(e) =>
                          q.setItem(item.uid, {
                            frequency: (e.target.value || undefined) as SupplyFrequency | undefined,
                          })
                        }
                        options={[{ value: "", label: copy.rfq.optional }, ...frequencyOptions]}
                      />
                    )}
                    {notesOpen && (
                      <TextArea
          maxLength={FIELD_LIMITS.maxNotes}
                        label={t.notes}
                        rows={2}
                        value={item.notes ?? ""}
                        placeholder={t.notesPlaceholder}
                        onChange={(e) => q.setItem(item.uid, { notes: e.target.value })}
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {q.items.length > 0 && (
        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-sm text-ink/60">{t.totalBales}</span>
          <span className="mono-num font-display text-3xl">{formatNumber(q.totalBales)}</span>
        </div>
      )}

      {/* Supply shape */}
      <div className="mt-12 border-t border-ink/12 pt-8">
        <ChoiceGroup
          label={t.supplyTitle}
          name="supplyMode"
          value={q.request.supplyMode}
          onChange={(v) =>
            q.patchRequest({
              supplyMode: v as SupplyMode,
              frequency: v === "recurring" ? (q.request.frequency ?? "monthly") : null,
            })
          }
          options={[
            { value: "one-time", label: t.oneTime, hint: t.oneTimeHint },
            { value: "recurring", label: t.recurring, hint: t.recurringHint },
          ]}
        />

        {q.request.supplyMode === "recurring" && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <SelectField
              label={t.frequency}
              value={q.request.frequency ?? "monthly"}
              onChange={(e) => q.patchRequest({ frequency: e.target.value as SupplyFrequency })}
              options={frequencyOptions}
            />
            {q.request.frequency === "custom" && (
              <TextField
          maxLength={FIELD_LIMITS.maxShortText}
                label={t.frequencyCustom}
                value={q.request.frequencyNote}
                placeholder={t.frequencyCustomPlaceholder}
                onChange={(e) => q.patchRequest({ frequencyNote: e.target.value })}
              />
            )}
          </div>
        )}
      </div>

      {/* Pricing — deliberately not a number */}
      <div className="mt-10 border border-ink/12 bg-cream-deep p-5 md:p-6">
        <p className="eyebrow text-ink/60">{t.pricingTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{t.pricingText}</p>
      </div>

      {q.items.length > 0 && (
        <Button href="/products" variant="link-dark" className="mt-8">
          {t.browse}
        </Button>
      )}
    </div>
  );
}
