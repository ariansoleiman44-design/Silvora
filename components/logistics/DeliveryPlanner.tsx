"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ChoiceGroup, SelectField, TextArea, TextField } from "@/components/ui/Field";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { useQuote } from "@/lib/quote-store";

import { track } from "@/lib/analytics";
import { useCopy, useLocalePath } from "@/lib/locale-client";
import type { OrderKind } from "@/types/quote";

/**
 * DELIVERY PLANNER
 * --------------------------------------------------------------------
 * Collects what a transport planner needs and promises nothing: no
 * freight price, no ETA, no coverage claim. It exists so a buyer can
 * hand over access constraints once, early, instead of discovering them
 * on the day a truck arrives at a gate it cannot turn in.
 *
 * Everything entered here lands in the same persisted quote state the
 * RFQ wizard uses, so continuing to /quote carries it across.
 */
export function DeliveryPlanner() {
  const copy = useCopy();
  const orderKindLabels = copy.rfq.orderKinds;
  const t = copy.deliveryPlanner;
  const q = useQuote();
  const router = useRouter();
  // /quote must keep the visitor in their language — a bare push
  // sent Arabic and Kurdish buyers into the English wizard.
  const withLocale = useLocalePath();
  const [added, setAdded] = useState(false);
  const d = q.request.delivery;

  const submit = () => {
    q.patchRequirements({
      estimatedQuantity: q.request.requirements.estimatedQuantity,
      deliveryRequired: "yes",
    });
    // No location string: a region plus a timestamp identifies a buyer.
    track("delivery_planner_completed", { orderType: q.request.orderType });
    setAdded(true);
    router.push(withLocale("/quote"));
  };

  return (
    <section id="plan-delivery" className="section-y scroll-mt-28 bg-cream-deep text-ink">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow className="mb-6">{t.eyebrow}</Eyebrow>
            </Reveal>
            <RevealLines lines={t.headline} className="display-md uppercase" />
            <Reveal delay={0.15}>
              <p className="body-lg mt-6 max-w-sm text-ink/65">{t.intro}</p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 flex gap-3 border border-ink/12 bg-cream p-4 text-xs leading-relaxed text-ink/65">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
                <span>{t.result}</span>
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="grid gap-8 sm:grid-cols-2">
              <TextField
                label={copy.rfq.delivery.country}
                value={d.country}
                onChange={(e) => q.patchDelivery({ country: e.target.value })}
                autoComplete="country-name"
              />
              <TextField
                label={copy.rfq.delivery.region}
                value={d.region}
                onChange={(e) => q.patchDelivery({ region: e.target.value })}
                autoComplete="address-level2"
              />
              <SelectField
                label={t.orderType}
                value={q.request.orderType}
                onChange={(e) => q.patchRequest({ orderType: e.target.value as OrderKind })}
                options={(Object.keys(orderKindLabels) as OrderKind[]).map((k) => ({
                  value: k,
                  label: orderKindLabels[k],
                }))}
              />
              <TextField
                label={t.quantity}
                type="number"
                inputMode="numeric"
                min={1}
                hint={copy.common.bales}
                value={q.request.requirements.estimatedQuantity ?? ""}
                onChange={(e) => q.patchRequirements({ estimatedQuantity: e.target.value })}
              />
              <TextField
                label={copy.rfq.delivery.preferredDate}
                hint={copy.rfq.delivery.preferredDateHint}
                type="date"
                value={d.preferredDate}
                onChange={(e) => q.patchDelivery({ preferredDate: e.target.value })}
              />
              <ChoiceGroup
                label={copy.rfq.delivery.unload}
                name="plannerUnload"
                value={d.unloadEquipment}
                onChange={(v) => q.patchDelivery({ unloadEquipment: v as "yes" | "no" })}
                options={[
                  { value: "yes", label: copy.rfq.delivery.unloadYes },
                  { value: "no", label: copy.rfq.delivery.unloadNo },
                ]}
              />
              <TextArea
                label={copy.rfq.delivery.notes}
                rows={4}
                placeholder={copy.rfq.delivery.notesPlaceholder}
                value={d.notes}
                onChange={(e) => q.patchDelivery({ notes: e.target.value })}
                className="sm:col-span-2"
              />
            </div>

            <Button variant="ink" size="lg" className="mt-8" icon={added ? "none" : "arrow"} onClick={submit}>
              {added ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> {t.added}
                </span>
              ) : (
                t.cta
              )}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
