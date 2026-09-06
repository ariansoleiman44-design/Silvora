"use client";

import { AlertTriangle, Check } from "lucide-react";
import { m, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { QuoteActions } from "@/components/quote/QuoteActions";
import { useCopy } from "@/lib/locale-client";
import type { QuoteRequest, SubmissionResult } from "@/types/quote";

/**
 * The end of the flow — in one of two honest states.
 *
 *   Delivered ("api", and "mock" during development):
 *     the request reached the configured endpoint.
 *
 *   Not connected ("unconfigured"):
 *     a production build with no backend. We say plainly that nothing
 *     was sent and hand the buyer the summary to send themselves. It is
 *     NOT dressed up as a success — see lib/quote-service.ts.
 */
export function QuoteConfirmation({
  result,
  request,
  onReset,
}: {
  result: SubmissionResult;
  request: QuoteRequest;
  onReset: () => void;
}) {
  const copy = useCopy();
  const t = copy.rfq.confirmation;
  const u = copy.rfq.unconfigured;
  const reduce = useReducedMotion();
  const notConnected = result.mode === "unconfigured";
  const reference = result.reference ?? request.reference;

  return (
    <m.div
      className="mx-auto max-w-2xl py-6 md:py-14"
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      role="status"
      aria-live="polite"
    >
      {notConnected ? (
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-ink/25 text-ink/70">
            <AlertTriangle className="h-7 w-7" strokeWidth={1.5} aria-hidden />
          </span>
          <h2 className="display-sm mt-8">{u.headline}</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink/70">{u.text}</p>
        </div>
      ) : (
        <div className="text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-gold text-gold">
            <Check className="h-8 w-8" strokeWidth={1.5} aria-hidden />
          </span>
          <p className="eyebrow mt-8 text-gold">{t.eyebrow}</p>
          <h2 className="display-lg mt-4 uppercase">{t.headline[0]}</h2>
          <p className="lead mt-6 text-ink/65">{t.text}</p>
        </div>
      )}

      {reference && (
        <p className="mx-auto mt-8 flex w-fit flex-col items-center gap-1 border border-ink/15 px-8 py-5">
          <span className="eyebrow text-ink/60">{t.reference}</span>
          <span className="mono-num font-display text-3xl">{reference}</span>
        </p>
      )}

      <QuoteActions request={request} className="mt-10" />

      {result.mode === "mock" && (
        <p className="mt-8 border border-gold/40 bg-gold/5 p-4 text-xs leading-relaxed text-ink/70">
          {t.mockNote}
        </p>
      )}

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        {notConnected ? (
          <Button href="/contact" variant="gold">
            {u.contactCta}
          </Button>
        ) : (
          <Button href="/products" variant="ink">
            {t.keepCta}
          </Button>
        )}
        <Button variant="outline-dark" icon="none" onClick={onReset}>
          {t.newCta}
        </Button>
      </div>
    </m.div>
  );
}
