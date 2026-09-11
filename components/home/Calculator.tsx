"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ChoiceGroup, NumberField, SelectField } from "@/components/ui/Field";
import { Counter } from "@/components/ui/Counter";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import {
  animalPresets,
  calculateSilage,
  calculatorDefaults,
  type CalculatorInput,
} from "@/lib/calculator";
import { useQuote } from "@/lib/quote-store";
import { track } from "@/lib/analytics";
import { useCopy, useLocalePath } from "@/lib/locale-client";
import { formatNumber, formatTonnes } from "@/lib/utils";

type Mode = "quick" | "herd";

/**
 * REQUIREMENT CALCULATOR
 * --------------------------------------------------------------------
 * Two modes over one calculation:
 *
 *   Quick estimate — animals, days, bale weight. Three numbers.
 *   Herd planner   — adds animal type (which seeds daily intake), waste
 *                    and reserve, and reports weekly / monthly draw so a
 *                    buyer can plan delivery cadence, not just a total.
 *
 * The result is a planning estimate and says so, prominently. It is
 * never presented as a ration recommendation.
 *
 * "Add estimate to request" writes the working into the quote store, so
 * the sales team sees the assumptions behind the number, not just the
 * number.
 */
export function Calculator() {
  const copy = useCopy();
  const t = copy.calculator;
  const q = useQuote();
  const router = useRouter();
  // /quote must keep the visitor in their language — a bare push
  // sent Arabic and Kurdish buyers into the English wizard.
  const withLocale = useLocalePath();
  const [mode, setMode] = useState<Mode>("quick");
  const [animalType, setAnimalType] = useState(animalPresets[0]!.key);
  const [input, setInput] = useState<CalculatorInput>(calculatorDefaults);
  const [added, setAdded] = useState(false);

  const result = useMemo(() => calculateSilage(input), [input]);
  const set = (key: keyof CalculatorInput) => (v: number) => setInput((s) => ({ ...s, [key]: v }));

  const pickAnimal = (key: string) => {
    setAnimalType(key);
    const preset = animalPresets.find((p) => p.key === key);
    if (preset) setInput((s) => ({ ...s, perAnimalPerDay: preset.perAnimalPerDay }));
  };

  const addToRequest = () => {
    q.patchRequest({
      estimate: {
        mode,
        animalType:
          mode === "herd"
            ? (t.animalTypes[animalType as keyof typeof t.animalTypes] ?? animalType)
            : undefined,
        animals: input.animals,
        perAnimalPerDay: input.perAnimalPerDay,
        days: input.days,
        usablePerBale: input.usablePerBale,
        wastePercent: input.wastePercent,
        reservePercent: input.reservePercent,
        totalKg: result.totalKg,
        bales: result.bales,
        reserveBales: result.reserveBales,
        balesWithReserve: result.balesWithReserve,
        weeklyKg: result.weeklyKg,
        monthlyKg: result.monthlyKg,
      },
    });
    q.patchRequirements({ estimatedQuantity: String(result.balesWithReserve) });
    track("calculator_completed", { calculatorMode: mode, bales: result.balesWithReserve });
    setAdded(true);
    router.push(withLocale("/quote"));
  };

  return (
    <section id="calculator" className="cv-auto section-y scroll-mt-28 bg-cream text-ink">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Inputs */}
          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow className="mb-6">{t.eyebrow}</Eyebrow>
            </Reveal>
            <RevealLines lines={t.headline} className="display-lg uppercase" />
            <Reveal delay={0.15}>
              <p className="body-lg mt-6 max-w-md text-ink/65">{t.intro}</p>
            </Reveal>

            <Reveal delay={0.18} className="mt-10">
              <ChoiceGroup
                label={t.eyebrow}
                name="calcMode"
                value={mode}
                onChange={(v) => setMode(v as Mode)}
                options={[
                  { value: "quick", label: t.modeQuick, hint: t.modeQuickHint },
                  { value: "herd", label: t.modeHerd, hint: t.modeHerdHint },
                ]}
              />
            </Reveal>

            <Reveal delay={0.2} className="mt-8 grid gap-8 sm:grid-cols-2">
              {mode === "herd" && (
                <SelectField
                  label={t.animalType}
                  hint={t.animalTypeHint}
                  value={animalType}
                  onChange={(e) => pickAnimal(e.target.value)}
                  options={animalPresets.map((p) => ({
                    value: p.key,
                    // Preset labels come from the dictionary; lib/calculator.ts
                    // holds the intake figures, which are language-neutral.
                    label: t.animalTypes[p.key as keyof typeof t.animalTypes] ?? p.label,
                  }))}
                  className="sm:col-span-2"
                />
              )}

              <NumberField
                label={t.fields.animals.label}
                hint={t.fields.animals.hint}
                value={input.animals}
                onChange={set("animals")}
                min={1}
                max={100000}
                step={10}
              />
              <NumberField
                label={t.fields.perDay.label}
                hint={t.fields.perDay.hint}
                value={input.perAnimalPerDay}
                onChange={set("perAnimalPerDay")}
                min={1}
                max={200}
                step={1}
                unit="kg"
              />
              <NumberField
                label={t.fields.days.label}
                hint={t.fields.days.hint}
                value={input.days}
                onChange={set("days")}
                min={1}
                max={730}
                step={10}
                unit="days"
              />
              <NumberField
                label={t.fields.perBale.label}
                hint={t.fields.perBale.hint}
                value={input.usablePerBale}
                onChange={set("usablePerBale")}
                min={50}
                max={3000}
                step={50}
                unit="kg"
              />

              {mode === "herd" && (
                <>
                  <NumberField
                    label={t.fields.waste.label}
                    hint={t.fields.waste.hint}
                    value={input.wastePercent}
                    onChange={set("wastePercent")}
                    min={0}
                    max={50}
                    step={1}
                    unit="%"
                  />
                  <NumberField
                    label={t.fields.reserve.label}
                    hint={t.fields.reserve.hint}
                    value={input.reservePercent}
                    onChange={set("reservePercent")}
                    min={0}
                    max={100}
                    step={5}
                    unit="%"
                  />
                </>
              )}
            </Reveal>
          </div>

          {/* Results */}
          <Reveal delay={0.25} className="lg:col-span-5 lg:col-start-8">
            <div className="grain relative flex h-full flex-col bg-ink p-7 text-cream md:p-10">
              <p className="eyebrow text-cream/65">{t.results.total}</p>
              <p className="mono-num mt-3 font-display text-[clamp(2.6rem,7vw,5.5rem)] leading-none">
                <Counter value={result.totalKg} format={(n) => formatTonnes(n)} />
              </p>
              <p className="mt-2 text-sm text-cream/65">
                ≈ <Counter value={result.totalKg} format={(n) => `${formatNumber(n)} kg`} />
              </p>

              <dl className="mt-8 divide-y divide-cream/12 border-y border-cream/12">
                <div className="flex items-baseline justify-between py-4">
                  <dt className="text-sm text-cream/65">{t.results.bales}</dt>
                  <dd className="mono-num font-display text-3xl">
                    <Counter value={result.bales} />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between py-4">
                  <dt className="text-sm text-cream/65">{t.results.reserve}</dt>
                  <dd className="mono-num font-display text-3xl">
                    +<Counter value={result.reserveBales} />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between py-4">
                  <dt className="text-sm font-medium text-cream">{t.results.withReserve}</dt>
                  <dd className="mono-num font-display text-4xl text-gold">
                    <Counter value={result.balesWithReserve} />
                  </dd>
                </div>

                {mode === "herd" && (
                  <>
                    <div className="flex items-baseline justify-between py-4">
                      <dt className="text-sm text-cream/65">{t.results.weekly}</dt>
                      <dd className="mono-num font-display text-2xl">
                        <Counter value={result.weeklyKg} format={(n) => formatTonnes(n)} />
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between py-4">
                      <dt className="text-sm text-cream/65">{t.results.monthly}</dt>
                      <dd className="mono-num font-display text-2xl">
                        <Counter value={result.monthlyKg} format={(n) => formatTonnes(n)} />
                      </dd>
                    </div>
                  </>
                )}
              </dl>

              <div className="mt-8 grid gap-3">
                <Button variant="gold" full icon={added ? "none" : "arrow"} onClick={addToRequest}>
                  {added ? (
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> {t.addedToQuote}
                    </span>
                  ) : (
                    t.addToQuote
                  )}
                </Button>
              </div>

              <p className="mt-6 flex gap-3 text-xs leading-relaxed text-cream/65">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
                <span>{t.disclaimer}</span>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
