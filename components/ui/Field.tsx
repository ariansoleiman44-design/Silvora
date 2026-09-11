"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ComponentPropsWithoutRef, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Form primitives with a quiet editorial style: label above, hairline
 * underline, gold focus. Works on light and dark surfaces via `tone`.
 */

type Tone = "light" | "dark";

interface CommonProps {
  label: string;
  hint?: string;
  error?: string;
  tone?: Tone;
  required?: boolean;
  className?: string;
}

const labelCls = (tone: Tone) =>
  cn("eyebrow mb-3 block", tone === "dark" ? "text-cream/70" : "text-ink/60");

const controlCls = (tone: Tone, hasError?: boolean) =>
  cn(
    "w-full appearance-none rounded-none border-0 border-b bg-transparent px-0 py-3 text-base leading-tight outline-none transition-colors duration-300 placeholder:opacity-40",
    tone === "dark"
      ? "border-cream/25 text-cream focus:border-gold placeholder:text-cream"
      : "border-ink/25 text-ink focus:border-ink placeholder:text-ink",
    hasError && "border-red-600",
  );

const hintCls = (tone: Tone) =>
  cn("mt-2 text-xs", tone === "dark" ? "text-cream/65" : "text-ink/60");

function Wrapper({
  id,
  label,
  hint,
  error,
  tone = "light",
  required,
  className,
  children,
}: CommonProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={labelCls(tone)}>
        {label}
        {required && (
          <span aria-hidden className="ms-1 text-gold">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={hintCls(tone)}>{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  tone = "light",
  required,
  className,
  ...input
}: CommonProps & Omit<ComponentPropsWithoutRef<"input">, "className">) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} tone={tone} required={required} className={className}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={controlCls(tone, Boolean(error))}
        {...input}
      />
    </Wrapper>
  );
}

export function TextArea({
  label,
  hint,
  error,
  tone = "light",
  required,
  className,
  ...textarea
}: CommonProps & Omit<ComponentPropsWithoutRef<"textarea">, "className">) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} tone={tone} required={required} className={className}>
      <textarea
        id={id}
        required={required}
        rows={4}
        aria-invalid={error ? true : undefined}
        className={cn(controlCls(tone, Boolean(error)), "resize-y min-h-28")}
        {...textarea}
      />
    </Wrapper>
  );
}

export function SelectField({
  label,
  hint,
  error,
  tone = "light",
  required,
  className,
  options,
  placeholder,
  ...select
}: CommonProps &
  Omit<ComponentPropsWithoutRef<"select">, "className"> & {
    options: { value: string; label: string }[];
    placeholder?: string;
  }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} tone={tone} required={required} className={className}>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(controlCls(tone, Boolean(error)), "select-reset pe-8 cursor-pointer")}
          {...select}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-ink">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute end-0 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
    </Wrapper>
  );
}

/** Large tappable choice tiles (single select). */
export function ChoiceGroup({
  label,
  name,
  value,
  onChange,
  options,
  tone = "light",
  columns = 2,
  className,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
  tone?: Tone;
  columns?: 2 | 3;
  className?: string;
}) {
  const id = useId();
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className={labelCls(tone)}>{label}</legend>
      <div className={cn("grid gap-2", columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
        {options.map((o) => {
          const active = value === o.value;
          const optId = `${id}-${o.value}`;
          return (
            <label
              key={o.value}
              htmlFor={optId}
              className={cn(
                "flex min-h-14 cursor-pointer flex-col justify-center rounded-[2px] border px-4 py-3 transition-colors duration-300",
                /*
                 * The radio itself is sr-only, so focus landed on an
                 * invisible element and these tiles — the wizard's main
                 * controls — showed nothing at all to a keyboard user.
                 *
                 * `has-[:focus-visible]` rather than `peer-*` because
                 * the input is a CHILD of this label, not a sibling.
                 * The ring is the same two-tone pair as the global one
                 * in globals.css, so it stays visible on the cream
                 * tiles and the ink ones alike.
                 */
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink has-[:focus-visible]:shadow-[0_0_0_4px_var(--color-gold)]",
                tone === "dark"
                  ? active
                    ? "border-gold bg-gold/10 text-cream"
                    : "border-cream/20 text-cream/80 hover:border-cream/50"
                  : active
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/20 text-ink hover:border-ink/60",
              )}
            >
              <input
                id={optId}
                type="radio"
                name={name}
                value={o.value}
                checked={active}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium leading-snug">{o.label}</span>
              {o.hint && <span className="mt-0.5 text-xs opacity-60">{o.hint}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Number field with +/- controls. */
export function NumberField({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  unit,
  tone = "light",
  className,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  tone?: Tone;
  className?: string;
}) {
  const id = useId();
  // The in-progress string while the field has focus; null when not
  // being edited, so the committed number shows through.
  const [draft, setDraft] = useState<string | null>(null);
  const clampVal = (v: number) => Math.min(max, Math.max(min, v));
  const btn = cn(
    "grid h-11 w-11 shrink-0 place-items-center rounded-full border text-lg leading-none transition-colors",
    tone === "dark" ? "border-cream/25 hover:bg-cream/10" : "border-ink/20 hover:bg-ink/5",
  );
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={labelCls(tone)}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={btn}
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clampVal(value - step))}
        >
          −
        </button>
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            /*
             * While the field has focus the raw string is shown as typed
             * and only the UPPER bound is applied; the lower bound waits
             * for blur.
             *
             * Clamping up to `min` on every keystroke made larger values
             * impossible to enter. With min=50, typing 7-0-0 for 700 went
             * "7" -> clamped to 50 -> the controlled input became "50",
             * and the next keystrokes appended to that. The buyer could
             * not type the number they wanted and usually did not notice
             * the field had rewritten itself.
             */
            value={draft ?? (Number.isFinite(value) ? String(value) : "")}
            onFocus={() => setDraft(Number.isFinite(value) ? String(value) : "")}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft(raw);
              const n = parseFloat(raw);
              if (Number.isFinite(n)) onChange(Math.min(n, max));
            }}
            onBlur={() => {
              const n = parseFloat(draft ?? "");
              onChange(Number.isFinite(n) ? clampVal(n) : clampVal(value));
              setDraft(null);
            }}
            className={cn(controlCls(tone), "mono-num pe-12 text-center text-lg")}
          />
          {unit && (
            <span
              className={cn(
                "pointer-events-none absolute end-0 top-1/2 -translate-y-1/2 text-xs",
                tone === "dark" ? "text-cream/65" : "text-ink/60",
              )}
            >
              {unit}
            </span>
          )}
        </div>
        <button
          type="button"
          className={btn}
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clampVal(value + step))}
        >
          +
        </button>
      </div>
      {hint && <p className={hintCls(tone)}>{hint}</p>}
    </div>
  );
}

/** Compact quantity stepper used in the quote drawer and product page. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 9999,
  tone = "light",
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  tone?: Tone;
  size?: "sm" | "md";
  label?: string;
}) {
  const clampVal = (v: number) => Math.min(max, Math.max(min, v));
  const h = size === "sm" ? "h-10" : "h-[3.25rem]";
  const w = size === "sm" ? "w-10" : "w-12";
  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-[2px] border",
        h,
        tone === "dark" ? "border-cream/25" : "border-ink/25",
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(clampVal(value - 1))}
        className={cn("grid place-items-center text-lg leading-none", w, tone === "dark" ? "hover:bg-cream/10" : "hover:bg-ink/5")}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) ? clampVal(n) : min);
        }}
        className={cn(
          // 16px on mobile: anything smaller makes iOS Safari zoom the
          // page on focus, which throws a buyer out of the flow.
          "mono-num w-14 border-x bg-transparent text-center text-base outline-none sm:text-sm",
          tone === "dark" ? "border-cream/25" : "border-ink/25",
        )}
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(clampVal(value + 1))}
        className={cn("grid place-items-center text-lg leading-none", w, tone === "dark" ? "hover:bg-cream/10" : "hover:bg-ink/5")}
      >
        +
      </button>
    </div>
  );
}
