"use client";

import { Check } from "lucide-react";
import { cn, pad2 } from "@/lib/utils";
import { useCopy } from "@/lib/locale-client";

export interface WizardStep {
  key: string;
  label: string;
}

/**
 * Wizard progress. A numbered rail on desktop; on mobile a single line
 * of text plus a hairline bar, because a five-item rail eats the top of
 * a 390px screen for no benefit.
 *
 * Completed steps are links back; future steps are not reachable by
 * click, so a buyer cannot skip past a step that still needs an answer.
 */
export function QuoteProgress({
  steps,
  current,
  onSelect,
}: {
  steps: WizardStep[];
  current: number;
  onSelect: (index: number) => void;
}) {
  const copy = useCopy();
  const t = copy.rfq;
  const pct = ((current + 1) / steps.length) * 100;

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between gap-4">
          <p className="eyebrow text-ink/60">
            {t.stepLabel} {pad2(current + 1)} {t.of} {pad2(steps.length)}
          </p>
          <p className="eyebrow text-gold">{steps[current]?.label}</p>
        </div>
        <div
          className="mt-3 h-px w-full bg-ink/15"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={current + 1}
          aria-label={steps[current]?.label}
        >
          <div
            className="h-px bg-gold transition-[width] duration-500 ease-[var(--ease-luxe)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Desktop rail */}
      <ol className="hidden lg:block" aria-label={t.eyebrow}>
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.key} className="border-b border-ink/12 last:border-b-0">
              <button
                type="button"
                onClick={() => (done ? onSelect(i) : undefined)}
                disabled={!done}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-4 py-4 text-start transition-colors duration-300",
                  done && "cursor-pointer hover:text-ink",
                  active ? "text-ink" : "text-ink/45",
                )}
              >
                <span
                  className={cn(
                    "mono-num grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs transition-colors duration-300",
                    active
                      ? "border-gold bg-gold text-ink"
                      : done
                        ? "border-ink/25 text-ink"
                        : "border-ink/15 text-ink/40",
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> : pad2(i + 1)}
                </span>
                <span className="eyebrow">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
