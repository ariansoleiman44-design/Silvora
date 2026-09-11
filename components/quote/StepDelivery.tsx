"use client";

import { ChoiceGroup, TextArea, TextField } from "@/components/ui/Field";
import { useQuote } from "@/lib/quote-store";
import { useCopy } from "@/lib/locale-client";
import { FIELD_LIMITS } from "@/lib/form-limits";

/**
 * Step 3 — where the load is going and whether it can be unloaded.
 *
 * Deliberately promises nothing: no ETA, no freight cost, no coverage
 * claim. It collects what a transport planner would need to answer those
 * questions later.
 */
export function StepDelivery() {
  const copy = useCopy();
  const q = useQuote();
  const t = copy.rfq.delivery;
  const d = q.request.delivery;

  return (
    <div>
      <h2 className="display-sm">{t.title}</h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/65">{t.intro}</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <TextField
          maxLength={FIELD_LIMITS.maxShortText}
          label={t.country}
          value={d.country}
          onChange={(e) => q.patchDelivery({ country: e.target.value })}
          autoComplete="country-name"
        />
        <TextField
          maxLength={FIELD_LIMITS.maxShortText}
          label={t.region}
          value={d.region}
          onChange={(e) => q.patchDelivery({ region: e.target.value })}
          autoComplete="address-level2"
        />
        <TextField
          maxLength={FIELD_LIMITS.maxShortText}
          label={t.preferredDate}
          hint={t.preferredDateHint}
          type="date"
          value={d.preferredDate}
          onChange={(e) => q.patchDelivery({ preferredDate: e.target.value })}
        />
        <ChoiceGroup
          label={t.unload}
          name="unloadEquipment"
          value={d.unloadEquipment}
          onChange={(v) => q.patchDelivery({ unloadEquipment: v as "yes" | "no" })}
          options={[
            { value: "yes", label: t.unloadYes },
            { value: "no", label: t.unloadNo },
          ]}
        />
        <TextArea
          maxLength={FIELD_LIMITS.maxNotes}
          label={t.notes}
          rows={4}
          placeholder={t.notesPlaceholder}
          value={d.notes}
          onChange={(e) => q.patchDelivery({ notes: e.target.value })}
          className="sm:col-span-2"
        />
      </div>
    </div>
  );
}
