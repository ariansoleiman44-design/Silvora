"use client";

import type { ReactNode } from "react";
import { LogoSymbol } from "@/components/ui/Logo";

import { siteConfig } from "@/data/site-config";
import { useCopy } from "@/lib/locale-client";
import { formatNumber, formatTonnes } from "@/lib/utils";
import type { QuoteRequest } from "@/types/quote";

/**
 * Step 5 — the procurement document.
 *
 * This block is also the print root (`data-print-root`), so what a buyer
 * sees here is exactly what comes out of the office printer: branding,
 * reference, lines, requirements, delivery, buyer. No navigation, no
 * imagery, no colour fields.
 */

function Row({ label, value }: { label: string; value?: ReactNode }) {
  if (value === undefined || value === null || value === "" || value === false) return null;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-2.5 last:border-b-0">
      <dt className="text-sm text-ink/55">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

function Section({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-ink/20 pt-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="eyebrow text-ink">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="link-line no-print text-xs font-medium text-ink/60 hover:text-ink"
          >
            {editLabel}
          </button>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function StepReview({
  request,
  onEditStep,
}: {
  request: QuoteRequest;
  onEditStep: (index: number) => void;
}) {
  const copy = useCopy();
  const frequencyLabels = copy.rfq.frequencies;
  const orderKindLabels = copy.rfq.orderKinds;
  const t = copy.rfq.review;
  const r = request.requirements;
  const est = request.calculatorEstimate;

  const supply =
    request.supplyMode === "recurring"
      ? request.frequency === "custom"
        ? `${copy.rfq.products.recurring} — ${request.frequencyNote || copy.rfq.products.frequencyCustom}`
        : `${copy.rfq.products.recurring} — ${request.frequency ? frequencyLabels[request.frequency] : ""}`
      : copy.rfq.products.oneTime;

  return (
    <div>
      <h2 className="display-sm no-print">{t.title}</h2>
      <p className="no-print mt-3 max-w-lg text-sm leading-relaxed text-ink/65">{t.intro}</p>

      <div data-print-root className="mt-8 bg-cream text-ink">
        {/* Print-only masthead */}
        <div className="mb-6 hidden items-center justify-between border-b border-ink/20 pb-4 print:flex">
          <div className="flex items-center gap-3">
            <LogoSymbol className="h-8 w-8" />
            <span className="font-display text-2xl tracking-[0.08em]">{siteConfig.brandName}</span>
          </div>
          <div className="text-end">
            <p className="eyebrow text-ink/60">{t.reference}</p>
            <p className="mono-num font-display text-xl">{request.reference}</p>
          </div>
        </div>

        <div className="grid gap-8">
          <Section title={t.products} editLabel={copy.rfq.edit} onEdit={() => onEditStep(0)}>
            {request.products.length === 0 ? (
              <p className="text-sm text-ink/55">{t.noProducts}</p>
            ) : (
              <ul className="border-b border-ink/10">
                {request.products.map((i) => (
                  <li
                    key={i.uid}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-ink/10 py-3 first:border-t-0"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight">{i.name}</p>
                      <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-ink/55">
                        {i.format}
                        {i.frequency ? ` · ${frequencyLabels[i.frequency]}` : ""}
                      </p>
                      {i.notes && <p className="mt-1 text-sm text-ink/65">{i.notes}</p>}
                    </div>
                    <p className="mono-num font-display text-xl">
                      {formatNumber(i.quantity)}{" "}
                      <span className="text-xs uppercase tracking-[0.14em] text-ink/55">
                        {copy.common.bales}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={t.order} editLabel={copy.rfq.edit} onEdit={() => onEditStep(1)}>
            <dl>
              <Row label={t.order} value={orderKindLabels[request.orderType]} />
              <Row label={copy.rfq.products.supplyTitle} value={supply} />
              <Row
                label={copy.rfq.products.totalBales}
                value={request.products.length ? formatNumber(request.products.reduce((n, i) => n + i.quantity, 0)) : undefined}
              />
            </dl>
          </Section>

          <Section title={t.requirements} editLabel={copy.rfq.edit} onEdit={() => onEditStep(1)}>
            <dl>
              <Row label={copy.rfq.fields.estimatedQuantity} value={r.estimatedQuantity} />
              <Row label={copy.rfq.fields.livestock} value={r.livestock} />
              <Row label={copy.rfq.fields.animalCount} value={r.animalCount} />
              <Row label={copy.rfq.fields.monthlyVolume} value={r.monthlyVolume} />
              <Row label={copy.rfq.fields.preferredFormat} value={r.preferredFormat} />
              <Row label={copy.rfq.fields.contractLength} value={r.contractLength} />
              <Row label={copy.rfq.fields.resaleTerritory} value={r.resaleTerritory} />
              <Row label={copy.rfq.fields.packagingRequirements} value={r.packagingRequirements} />
              <Row label={copy.rfq.fields.privateLabel} value={r.privateLabelInterest} />
              <Row label={copy.rfq.fields.destinationCountry} value={r.destinationCountry} />
              <Row label={copy.rfq.fields.destinationPort} value={r.destinationPort} />
              <Row label={copy.rfq.fields.loadPreference} value={r.loadPreference} />
              <Row label={copy.rfq.fields.incoterm} value={r.incoterm} />
              <Row label={copy.rfq.fields.labData} value={r.labDataRequested ? copy.rfq.fields.yes : undefined} />
            </dl>
          </Section>

          <Section title={t.delivery} editLabel={copy.rfq.edit} onEdit={() => onEditStep(2)}>
            <dl>
              <Row label={copy.rfq.delivery.country} value={request.delivery.country} />
              <Row label={copy.rfq.delivery.region} value={request.delivery.region} />
              <Row label={copy.rfq.fields.deliveryRequired} value={r.deliveryRequired} />
              <Row label={copy.rfq.delivery.preferredDate} value={request.delivery.preferredDate} />
              <Row label={copy.rfq.delivery.unload} value={request.delivery.unloadEquipment} />
              <Row label={copy.rfq.delivery.notes} value={request.delivery.notes} />
            </dl>
          </Section>

          {est && (
            <Section title={t.estimate} editLabel={copy.rfq.edit} onEdit={() => onEditStep(1)}>
              <dl>
                <Row label="Animals" value={formatNumber(est.animals)} />
                <Row label="Feeding days" value={formatNumber(est.days)} />
                <Row label="Total requirement" value={formatTonnes(est.totalKg)} />
                <Row label="Bales incl. reserve" value={formatNumber(est.balesWithReserve)} />
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-ink/55">{copy.calculator.disclaimer}</p>
            </Section>
          )}

          <Section title={t.buyer} editLabel={copy.rfq.edit} onEdit={() => onEditStep(3)}>
            <dl>
              <Row label={copy.rfq.contact.name} value={request.buyer.name} />
              <Row label={copy.rfq.contact.company} value={request.buyer.company} />
              <Row label={copy.rfq.contact.phone} value={request.buyer.phone} />
              <Row label={copy.rfq.contact.whatsapp} value={request.buyer.whatsapp} />
              <Row label={copy.rfq.contact.email} value={request.buyer.email} />
            </dl>
          </Section>

          {request.notes && (
            <Section title={t.notes} editLabel={copy.rfq.edit} onEdit={() => onEditStep(3)}>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink/75">{request.notes}</p>
            </Section>
          )}

          <p className="border-t border-ink/20 pt-4 text-xs leading-relaxed text-ink/55">
            {copy.rfq.products.pricingText}
          </p>
        </div>
      </div>
    </div>
  );
}
