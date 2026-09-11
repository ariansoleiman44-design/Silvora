"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuoteProgress, type WizardStep } from "@/components/quote/QuoteProgress";
import { StepProducts } from "@/components/quote/StepProducts";
import { StepRequirements } from "@/components/quote/StepRequirements";
import { StepDelivery } from "@/components/quote/StepDelivery";
import { StepContact, type ContactErrors } from "@/components/quote/StepContact";
import { StepReview } from "@/components/quote/StepReview";
import { QuoteActions } from "@/components/quote/QuoteActions";
import { QuoteConfirmation } from "@/components/quote/QuoteConfirmation";
import { useQuote } from "@/lib/quote-store";
import { createIdempotencyKey, quoteService } from "@/lib/quote-service";
import { track } from "@/lib/analytics";
import { useCopy } from "@/lib/locale-client";
import { cn } from "@/lib/utils";
import type { QuoteRequest, SubmissionResult } from "@/types/quote";

type Status = "idle" | "submitting" | "done";

/**
 * RFQ WIZARD
 * --------------------------------------------------------------------
 * Five steps instead of one long form, because the buying flow is judged
 * on a 390px screen: Products → Requirements → Delivery → Contact →
 * Review.
 *
 * Everything the buyer types goes straight into the persisted quote
 * store, so a refresh, a phone call or an accidental tab close mid-flow
 * loses nothing. Only the step index and validation live locally.
 *
 * Motion follows the V2 language: one short fade/rise per step change,
 * skipped entirely under prefers-reduced-motion.
 */
export function QuoteWizard() {
  const copy = useCopy();
  const q = useQuote();
  const reduce = useReducedMotion();
  const t = copy.rfq;

  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const prefilledRef = useRef(false);
  // Fixed per submission attempt: a retry after a timeout reuses it, so
  // a request that actually landed is not stored twice. Both of these
  // are seeded in the mount effect below — generating them during
  // render would be an impure render.
  const idempotencyRef = useRef<string>("");
  const formStartedAtRef = useRef<number>(0);
  // Honeypot: must stay empty. See lib/server/guards.ts.
  const [honeypot, setHoneypot] = useState("");

  const steps: WizardStep[] = useMemo(
    () => [
      { key: "products", label: t.steps.products },
      { key: "requirements", label: t.steps.requirements },
      { key: "delivery", label: t.steps.delivery },
      { key: "contact", label: t.steps.contact },
      { key: "review", label: t.steps.review },
    ],
    [t.steps],
  );
  const isLast = step === steps.length - 1;

  /* ----------------------------------------------- URL prefill ----- */
  // Legacy entry points (?bales=, ?delivery=) still work. Read once from
  // location rather than useSearchParams: that hook would opt the whole
  // wizard out of server rendering for a value used exactly once.
  useEffect(() => {
    if (!q.hydrated || prefilledRef.current) return;
    prefilledRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const bales = params.get("bales");
    const delivery = params.get("delivery");
    if (bales && !q.request.requirements.estimatedQuantity) {
      q.patchRequirements({ estimatedQuantity: bales });
    }
    if (delivery === "yes" && !q.request.requirements.deliveryRequired) {
      q.patchRequirements({ deliveryRequired: "yes" });
    }
  }, [q]);

  useEffect(() => {
    if (!q.hydrated || startedRef.current) return;
    startedRef.current = true;
    idempotencyRef.current = createIdempotencyKey();
    formStartedAtRef.current = Date.now();
    q.ensureReference();
    track("quote_started", { orderType: q.request.orderType, lines: q.items.length });
  }, [q]);

  /* ------------------------------------------------- validation ---- */
  const validateContact = useCallback((): boolean => {
    const b = q.request.buyer;
    const next: ContactErrors = {};
    if (!b.name.trim()) next.name = t.contact.required;
    if (!b.phone.trim() && !b.email.trim() && !b.whatsapp.trim()) {
      next.contact = t.contact.needContact;
    }
    if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) next.email = t.contact.badEmail;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [q.request.buyer, t.contact]);

  const goTo = useCallback(
    (index: number) => {
      setStep((current) => {
        // Each step becomes a history entry, so the phone's back gesture
        // steps backwards through the flow instead of abandoning it.
        if (index !== current) {
          window.history.pushState({ cornFodderStep: index }, "");
        }
        return index;
      });
      // Keep the step heading in view without yanking the whole page.
      topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    },
    [reduce],
  );

  // Seed the first entry, then follow back/forward.
  useEffect(() => {
    window.history.replaceState({ cornFodderStep: 0 }, "");
    const onPop = (e: PopStateEvent) => {
      const state = e.state as { cornFodderStep?: number } | null;
      if (typeof state?.cornFodderStep === "number") setStep(state.cornFodderStep);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const next = () => {
    if (step === 3 && !validateContact()) return;
    track("quote_step_completed", { step: steps[step]?.key ?? String(step) });
    goTo(Math.min(steps.length - 1, step + 1));
  };

  /* ----------------------------------------------------- submit ---- */
  // Pure: it must never write to the store, because it also runs during
  // render to feed the review step. The reference is minted by the mount
  // effect above and, as a backstop, in the submit handler — both of
  // which are safe places to dispatch.
  const buildRequest = useCallback(
    (reference = q.request.reference): QuoteRequest => {
      const r = q.request;
      return {
        reference,
        createdAt: new Date().toISOString(),
        orderType: r.orderType,
        buyer: r.buyer,
        company: r.buyer.company,
        products: q.items,
        requirements: r.requirements,
        delivery: r.delivery,
        supplyMode: r.supplyMode,
        frequency: r.frequency,
        frequencyNote: r.frequencyNote,
        calculatorEstimate: r.estimate,
        notes: r.notes,
        marketingConsent: r.marketingConsent,
        source: "quote-wizard",
      };
    },
    [q],
  );

  const [submitted, setSubmitted] = useState<QuoteRequest | null>(null);

  const submit = async () => {
    if (!validateContact()) {
      goTo(3);
      return;
    }
    // Mint the reference here if the mount effect has not already — an
    // event handler is a safe place to dispatch.
    const payload = buildRequest(q.ensureReference());
    setSubmitted(payload);
    setStatus("submitting");

    const res = await quoteService.submitQuote(
      // The honeypot and the timestamp travel with the payload; the
      // server strips them before validating.
      { ...payload, website: honeypot, formStartedAt: formStartedAtRef.current } as typeof payload,
      { idempotencyKey: idempotencyRef.current || createIdempotencyKey() },
    );

    setResult(res);
    track("quote_submitted", {
      orderType: payload.orderType,
      mode: res.mode,
      ok: res.ok,
      lines: payload.products.length,
    });

    // Only a delivered request, or an honestly unconfigured backend,
    // leaves the form. A transient failure keeps the buyer where they
    // are with everything they typed intact, and a retry button.
    if (res.ok || res.mode === "unconfigured") {
      setStatus("done");
      if (res.ok) q.clear();
    } else {
      setStatus("idle");
    }
    topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const resetAll = () => {
    q.clear();
    setSubmitted(null);
    setResult(null);
    setStatus("idle");
    setStep(0);
    // A genuinely new request must not reuse the previous attempt's key.
    idempotencyRef.current = createIdempotencyKey();
    formStartedAtRef.current = Date.now();
  };

  const request = submitted ?? buildRequest();

  /* ------------------------------------------------------ render --- */
  if (status === "done" && result) {
    return (
      <div ref={topRef} className="scroll-mt-28">
        <QuoteConfirmation result={result} request={request} onReset={resetAll} />
      </div>
    );
  }

  const failedApi = status !== "submitting" && result && !result.ok && result.mode === "api";
  // A hint, never proof: browsers report `onLine` optimistically.
  const looksOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  return (
    <div ref={topRef} className="scroll-mt-28">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Rail */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="lg:sticky lg:top-28">
            <QuoteProgress steps={steps} current={step} onSelect={goTo} />

            {q.restored && (
              <div className="no-print mt-8 hidden border border-ink/12 bg-cream-deep p-4 lg:block">
                <p className="text-xs leading-relaxed text-ink/65">{t.saved.notice}</p>
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="link-line mt-3 text-xs font-medium text-ink/70 hover:text-ink"
                >
                  {t.saved.clear}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step body. Bottom padding clears the mobile sticky bar. */}
        <div className="pb-28 lg:col-span-8 lg:pb-0 xl:col-span-8 xl:col-start-5">
          {q.restored && (
            <div className="no-print mb-8 flex items-center justify-between gap-4 border border-ink/12 bg-cream-deep px-4 py-3 lg:hidden">
              <p className="text-xs leading-relaxed text-ink/65">{t.saved.notice}</p>
              <button
                type="button"
                onClick={q.dismissRestored}
                className="eyebrow shrink-0 text-ink/50 hover:text-ink"
              >
                {t.saved.dismiss}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={step}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 && <StepProducts />}
              {step === 1 && <StepRequirements />}
              {step === 2 && <StepDelivery />}
              {step === 3 && (
                <>
                  <StepContact errors={errors} />
                  {/* Honeypot: hidden from people, ignored by assistive
                      technology, irresistible to naive bots. */}
                  <div aria-hidden className="absolute h-px w-px overflow-hidden opacity-0 -z-10 -left-[9999px]">
                    <label htmlFor="website-url">Website</label>
                    <input
                      id="website-url"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>
                </>
              )}
              {step === 4 && <StepReview request={request} onEditStep={goTo} />}
            </m.div>
          </AnimatePresence>

          {failedApi && (
            <div
              role="alert"
              className="no-print mt-8 border border-red-700/30 bg-red-700/5 p-4 text-sm text-red-800"
            >
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                <div>
                  <p className="font-medium">{t.failure.headline}</p>
                  <p className="mt-1 text-red-800/80">
                    {looksOffline ? t.failure.offline : (result?.error ?? t.failure.text)}
                  </p>
                  {/*
                    The server names the fields it refused. Those were
                    parsed and then dropped, so a buyer whose notes ran
                    over the limit saw only "we could not send this" with
                    no way to work out which field or why. The inputs are
                    capped now, so this should be unreachable through the
                    form — but a rejection the buyer cannot act on is
                    exactly the dead end worth keeping closed.
                  */}
                  {!looksOffline && result?.fields?.length ? (
                    <ul className="mt-2 list-disc space-y-1 ps-5 text-red-800/80">
                      {result.fields.map((f) => (
                        <li key={`${f.field}-${f.message}`}>{f.message}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-2 text-red-800/80">{t.failure.preserved}</p>
                </div>
              </div>
              {/* Nothing was lost — the same request can go out by hand. */}
              <QuoteActions request={request} className="mt-4" />
            </div>
          )}

          {/* Desktop controls */}
          <div className="no-print mt-10 hidden items-center justify-between gap-4 border-t border-ink/12 pt-8 lg:flex">
            <button
              type="button"
              onClick={() => goTo(Math.max(0, step - 1))}
              disabled={step === 0}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-medium transition-opacity",
                step === 0 ? "pointer-events-none opacity-0" : "text-ink/65 hover:text-ink",
              )}
            >
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.5} aria-hidden />
              {t.back}
            </button>
            {isLast ? (
              <Button variant="gold" size="lg" onClick={submit} disabled={status === "submitting"}>
                {status === "submitting"
                  ? t.review.submitting
                  : failedApi
                    ? t.failure.retry
                    : t.review.submit}
              </Button>
            ) : (
              <Button variant="gold" size="lg" onClick={next}>
                {t.continueCta}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky controls — the only persistent bar on this page. */}
      <div className="no-print fixed inset-x-0 bottom-0 z-[50] border-t border-ink/12 bg-cream/95 backdrop-blur-xl pb-safe lg:hidden">
        <div className="container-x flex items-center gap-3 py-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              aria-label={t.back}
              className="grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center rounded-[2px] border border-ink/20 text-ink"
            >
              <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" strokeWidth={1.5} aria-hidden />
            </button>
          )}
          {isLast ? (
            <Button variant="gold" full onClick={submit} disabled={status === "submitting"} className="flex-1">
              {status === "submitting"
                ? t.review.submitting
                : failedApi
                  ? t.failure.retry
                  : t.review.submit}
            </Button>
          ) : (
            <Button variant="gold" full onClick={next} className="flex-1">
              {t.continueCta}
            </Button>
          )}
        </div>
      </div>

      {/* Clear confirmation */}
      {confirmClear && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-ink/60 p-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={t.saved.confirmTitle}
        >
          <div className="w-full max-w-sm border border-ink/15 bg-cream p-6">
            <h2 className="display-xs">{t.saved.confirmTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/65">{t.saved.confirmText}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="ink"
                icon="none"
                full
                onClick={() => {
                  resetAll();
                  setConfirmClear(false);
                }}
              >
                {t.saved.confirmCta}
              </Button>
              <Button variant="outline-dark" icon="none" full onClick={() => setConfirmClear(false)}>
                {t.saved.confirmCancel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
