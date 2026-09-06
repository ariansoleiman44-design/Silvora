"use client";

import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { recommendBale, type FinderAnswers } from "@/lib/bale-finder";
import { useQuote } from "@/lib/quote-store";
import { media } from "@/data/media";
import { useCopy } from "@/lib/locale-client";
import { useDict } from "@/lib/locale-client";
import { cn, pad2 } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * FIND YOUR BALE — four-question deterministic questionnaire.
 */
export function BaleFinder() {
  const copy = useCopy();
  const { products, labels } = useDict();
  const formatLabels = labels.format;
  const t = copy.finder;
  const questions = t.questions;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<FinderAnswers>({});
  const [done, setDone] = useState(false);
  const quote = useQuote();
  const reduce = useReducedMotion();

  const q = questions[step]!;
  const total = questions.length;

  const choose = (value: string) => {
    const next = { ...answers, [q.key]: value };
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  };

  const back = () => {
    if (done) {
      setDone(false);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setDone(false);
  };

  const result = done ? recommendBale(answers, products) : null;
  const resultImg = result ? media[result.product.images[0] ?? "balesField"] : null;
  const added = result ? quote.lastAddedId === result.product.id : false;

  return (
    <section id="finder" className="cv-auto grain relative overflow-hidden bg-forest text-cream">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden>
        <Image src={media.cornLeaves.src} alt="" fill sizes="100vw" quality={60} className="object-cover" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest via-forest/80 to-forest" aria-hidden />

      <div className="container-x section-y relative z-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Reveal>
              <Eyebrow className="mb-6">{t.eyebrow}</Eyebrow>
            </Reveal>
            <RevealLines lines={t.headline} className="display-lg uppercase" />
            <Reveal delay={0.15}>
              <p className="body-lg mt-6 max-w-sm text-cream/65">{t.intro}</p>
            </Reveal>

            {/* Progress */}
            <ol className="mt-10 hidden gap-2 lg:flex" aria-label="Progress">
              {questions.map((qq, i) => (
                <li key={qq.key} className="flex-1">
                  <span
                    className={cn(
                      "block h-px w-full transition-colors duration-500",
                      i < step || done ? "bg-gold" : i === step ? "bg-cream" : "bg-cream/20",
                    )}
                  />
                  <span className={cn("eyebrow mt-3 block", i === step && !done ? "text-cream" : "text-cream/60")}>
                    {pad2(i + 1)}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <div className="min-h-[26rem] border-t border-cream/15 pt-8 md:min-h-[28rem]">
              <AnimatePresence mode="wait" initial={false}>
                {!done ? (
                  <m.div
                    key={q.key}
                    initial={reduce ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? undefined : { opacity: 0, x: -24 }}
                    transition={{ duration: 0.5, ease }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="eyebrow text-gold">
                        {pad2(step + 1)} <span className="text-cream/60">/ {pad2(total)}</span>
                      </p>
                      {step > 0 && (
                        <button
                          type="button"
                          onClick={back}
                          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-cream/60 hover:text-cream"
                        >
                          <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" strokeWidth={1.5} aria-hidden />
                          {copy.common.back}
                        </button>
                      )}
                    </div>
                    <h3 className="display-md mt-4">{q.question}</h3>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2" role="group" aria-label={q.question}>
                      {q.options.map((o) => {
                        const selected = answers[q.key as keyof FinderAnswers] === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => choose(o.value)}
                            aria-pressed={selected}
                            className={cn(
                              "group flex min-h-16 items-center justify-between gap-4 rounded-[2px] border px-5 py-4 text-start transition-all duration-300",
                              selected
                                ? "border-gold bg-gold/10"
                                : "border-cream/20 hover:border-cream/60 hover:bg-cream/5",
                            )}
                          >
                            <span>
                              <span className="block text-base font-medium">{o.label}</span>
                              {"hint" in o && o.hint && (
                                <span className="mt-0.5 block text-xs text-cream/65">{o.hint}</span>
                              )}
                            </span>
                            <span
                              className={cn(
                                "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                                selected ? "border-gold bg-gold text-ink" : "border-cream/30 group-hover:border-cream/70",
                              )}
                            >
                              {selected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </m.div>
                ) : (
                  result && (
                    <m.div
                      key="result"
                      initial={reduce ? false : { opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease }}
                      aria-live="polite"
                    >
                      <p className="eyebrow text-gold">{t.resultEyebrow}</p>
                      <div className="mt-6 grid gap-6 sm:grid-cols-12 sm:items-center">
                        <div className="graded relative aspect-[4/5] overflow-hidden bg-ink/40 sm:col-span-5">
                          {resultImg && (
                            <Image src={resultImg.src} alt={resultImg.alt} fill sizes="(min-width:640px) 30vw, 100vw" className="object-cover" />
                          )}
                          <span className="absolute start-4 top-4 z-[3] rounded-full bg-ink/55 px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-cream backdrop-blur-md">
                            {formatLabels[result.product.format]}
                          </span>
                        </div>
                        <div className="sm:col-span-7">
                          <h3 className="display-md">{result.product.name}</h3>
                          <p className="mt-3 font-display text-xl italic text-wheat/85">{result.product.tagline}</p>
                          <p className="mt-4 text-sm leading-relaxed text-cream/65">{result.reason}</p>
                          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Button
                              variant="gold"
                              icon={added ? "none" : "arrow"}
                              onClick={() => quote.addProduct(result.product, 1)}
                            >
                              {added ? copy.common.addedToQuote : t.resultCta}
                            </Button>
                            <Button href={`/products/${result.product.slug}`} variant="outline-light" icon="none">
                              {t.resultSecondary}
                            </Button>
                          </div>
                          <button
                            type="button"
                            onClick={restart}
                            className="link-line mt-6 text-xs uppercase tracking-[0.15em] text-cream/60 hover:text-cream"
                          >
                            {t.restart}
                          </button>
                        </div>
                      </div>
                    </m.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
