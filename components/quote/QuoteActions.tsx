"use client";

import { Check, Copy, MessageCircle, Printer } from "lucide-react";
import { useState } from "react";
import { buildQuoteSummary, buildWhatsappMessage, copyToClipboard } from "@/lib/quote-summary";
import { isWhatsappConfigured, whatsappHref } from "@/lib/contact";
import { track } from "@/lib/analytics";
import { useCopy } from "@/lib/locale-client";
import { cn } from "@/lib/utils";
import type { QuoteRequest } from "@/types/quote";

/**
 * The three ways a request leaves this screen without a backend: copy it
 * as text, hand it to WhatsApp, or print it.
 *
 * The WhatsApp button is absent — not disabled — unless a real number is
 * configured, so a placeholder number can never reach production.
 */
export function QuoteActions({
  request,
  className,
  tone = "light",
}: {
  request: QuoteRequest;
  className?: string;
  tone?: "light" | "dark";
}) {
  const copy = useCopy();
  const t = copy.rfq.actions;
  // The buyer copies and sends the summary in the language they read.
  // The internal sales email keeps the English defaults — see
  // lib/quote-summary.ts.
  const labels = { orderKinds: copy.rfq.orderKinds, frequencies: copy.rfq.frequencies };
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const dark = tone === "dark";

  const onCopy = async () => {
    const ok = await copyToClipboard(buildQuoteSummary(request, { labels }));
    setCopied(ok ? "ok" : "fail");
    window.setTimeout(() => setCopied("idle"), 2600);
  };

  const btn = cn(
    "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[2px] border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-300",
    dark
      ? "border-cream/25 text-cream/85 hover:border-cream/60 hover:bg-cream/5"
      : "border-ink/20 text-ink/85 hover:border-ink/60 hover:bg-ink/5",
  );

  return (
    <div className={cn("no-print", className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onCopy} className={btn} aria-live="polite">
          {copied === "ok" ? (
            <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          )}
          {copied === "ok" ? t.copied : t.copy}
        </button>

        {isWhatsappConfigured() && (
          <a
            href={whatsappHref(buildWhatsappMessage(request, labels))}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            onClick={() => track("whatsapp_click", { source: "quote-actions" })}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            {t.whatsapp}
          </a>
        )}

        <button type="button" onClick={() => window.print()} className={btn}>
          <Printer className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {t.print}
        </button>
      </div>

      {copied === "fail" && (
        <p className="mt-3 text-xs text-red-700" role="alert">
          {t.copyFailed}
        </p>
      )}
    </div>
  );
}
