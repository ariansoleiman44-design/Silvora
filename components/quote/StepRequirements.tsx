"use client";

import { ChoiceGroup, SelectField, TextField } from "@/components/ui/Field";
import { useQuote } from "@/lib/quote-store";
import { useDict } from "@/lib/locale-client";


import { useCopy } from "@/lib/locale-client";
import type { BaleFormat } from "@/types/product";
import type { OrderKind } from "@/types/quote";

/**
 * Step 2 — the buyer picks a procurement track, and only the fields that
 * track actually needs are shown. A dairy farmer never sees an Incoterm
 * field; an exporter is never asked how many cows they have.
 *
 * Selecting a track reveals fields rather than navigating, so answers
 * already given are never lost by changing your mind.
 */
export function StepRequirements() {
  const copy = useCopy();
  const orderKindLabels = copy.rfq.orderKinds;
  const formatLabels = useDict().labels.format;
  const q = useQuote();
  const t = copy.rfq;
  const f = t.fields;
  const r = q.request.requirements;
  const set = (key: keyof typeof r) => (e: { target: { value: string } }) =>
    q.patchRequirements({ [key]: e.target.value });

  const yesNo = [
    { value: "yes", label: f.yes },
    { value: "no", label: f.no },
  ];

  const formatOptions = [
    { value: "", label: f.anyFormat },
    ...(Object.keys(formatLabels) as BaleFormat[]).map((k) => ({
      value: formatLabels[k],
      label: formatLabels[k],
    })),
  ];

  return (
    <div>
      <h2 className="display-sm">{t.orderType.title}</h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/65">{t.orderType.intro}</p>

      <div className="mt-8">
        <ChoiceGroup
          label={orderKindLabels[q.request.orderType]}
          name="orderType"
          columns={2}
          value={q.request.orderType}
          onChange={(v) => q.patchRequest({ orderType: v as OrderKind })}
          options={[
            { value: "farm", label: t.orderType.farm, hint: t.orderType.farmHint },
            { value: "commercial", label: t.orderType.commercial, hint: t.orderType.commercialHint },
            { value: "distributor", label: t.orderType.distributor, hint: t.orderType.distributorHint },
            { value: "export", label: t.orderType.export, hint: t.orderType.exportHint },
          ]}
        />
      </div>

      <div className="mt-10 grid gap-8 border-t border-ink/12 pt-8 sm:grid-cols-2">
        {/* ---------------------------------------------------- Farm */}
        {q.request.orderType === "farm" && (
          <>
            <SelectField
              label={f.livestock}
              value={r.livestock ?? ""}
              onChange={set("livestock")}
              options={[
                { value: "", label: "—" },
                ...copy.quote.form.livestockOptions.map((o) => ({ value: o, label: o })),
              ]}
            />
            <TextField
              label={f.animalCount}
              type="number"
              inputMode="numeric"
              min={1}
              value={r.animalCount ?? ""}
              onChange={set("animalCount")}
            />
            <TextField
              label={f.estimatedQuantity}
              type="number"
              inputMode="numeric"
              min={1}
              hint={copy.common.bales}
              value={r.estimatedQuantity ?? ""}
              onChange={set("estimatedQuantity")}
            />
            <ChoiceGroup
              label={f.deliveryRequired}
              name="deliveryRequired"
              value={r.deliveryRequired ?? ""}
              onChange={(v) => q.patchRequirements({ deliveryRequired: v as "yes" | "no" })}
              options={[
                { value: "yes", label: f.deliveryYes },
                { value: "no", label: f.deliveryNo },
              ]}
            />
          </>
        )}

        {/* ---------------------------------------------- Commercial */}
        {q.request.orderType === "commercial" && (
          <>
            <TextField
              label={f.monthlyVolume}
              hint={f.monthlyVolumeHint}
              inputMode="numeric"
              value={r.monthlyVolume ?? ""}
              onChange={set("monthlyVolume")}
            />
            <SelectField
              label={f.preferredFormat}
              value={r.preferredFormat ?? ""}
              onChange={set("preferredFormat")}
              options={formatOptions}
            />
            <TextField
              label={f.contractLength}
              hint={f.contractHint}
              value={r.contractLength ?? ""}
              onChange={set("contractLength")}
            />
            <TextField
              label={f.estimatedQuantity}
              type="number"
              inputMode="numeric"
              min={1}
              hint={copy.common.bales}
              value={r.estimatedQuantity ?? ""}
              onChange={set("estimatedQuantity")}
            />
          </>
        )}

        {/* --------------------------------------------- Distributor */}
        {q.request.orderType === "distributor" && (
          <>
            <TextField
              label={f.resaleTerritory}
              value={r.resaleTerritory ?? ""}
              onChange={set("resaleTerritory")}
              autoComplete="country-name"
            />
            <TextField
              label={f.monthlyVolume}
              hint={f.monthlyVolumeHint}
              inputMode="numeric"
              value={r.monthlyVolume ?? ""}
              onChange={set("monthlyVolume")}
            />
            <TextField
              label={f.packagingRequirements}
              hint={f.packagingHint}
              value={r.packagingRequirements ?? ""}
              onChange={set("packagingRequirements")}
              className="sm:col-span-2"
            />
            <ChoiceGroup
              label={f.privateLabel}
              name="privateLabel"
              value={r.privateLabelInterest ?? ""}
              onChange={(v) => q.patchRequirements({ privateLabelInterest: v as "yes" | "no" })}
              options={yesNo}
            />
          </>
        )}

        {/* -------------------------------------------------- Export */}
        {q.request.orderType === "export" && (
          <>
            <TextField
              label={f.destinationCountry}
              value={r.destinationCountry ?? ""}
              onChange={set("destinationCountry")}
              autoComplete="country-name"
            />
            <TextField
              label={f.destinationPort}
              value={r.destinationPort ?? ""}
              onChange={set("destinationPort")}
            />
            <TextField
              label={f.estimatedQuantity}
              type="number"
              inputMode="numeric"
              min={1}
              hint={copy.common.bales}
              value={r.estimatedQuantity ?? ""}
              onChange={set("estimatedQuantity")}
            />
            <TextField
              label={f.loadPreference}
              value={r.loadPreference ?? ""}
              onChange={set("loadPreference")}
            />
            <TextField
              label={f.incoterm}
              hint={f.incotermHint}
              value={r.incoterm ?? ""}
              onChange={set("incoterm")}
              className="sm:col-span-2"
            />
          </>
        )}
      </div>

      <label className="mt-8 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={Boolean(r.labDataRequested)}
          onChange={(e) => q.patchRequirements({ labDataRequested: e.target.checked })}
          className="h-5 w-5 shrink-0 accent-[var(--color-gold)]"
        />
        <span className="text-ink/75">{f.labData}</span>
      </label>
    </div>
  );
}
