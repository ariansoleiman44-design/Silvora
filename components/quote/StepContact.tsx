"use client";

import { TextArea, TextField } from "@/components/ui/Field";
import { useQuote } from "@/lib/quote-store";
import { siteConfig } from "@/data/site-config";
import { useCopy } from "@/lib/locale-client";
import { FIELD_LIMITS } from "@/lib/form-limits";

export interface ContactErrors {
  name?: string;
  contact?: string;
  email?: string;
}

/**
 * Step 4 — who to reply to.
 *
 * Validation is deliberately loose: a name plus ONE of phone / WhatsApp
 * / email. Being strict about phone formats across Iraq, the Gulf and
 * export markets would reject valid buyers.
 */
export function StepContact({ errors }: { errors: ContactErrors }) {
  const copy = useCopy();
  const q = useQuote();
  const t = copy.rfq.contact;
  const b = q.request.buyer;

  return (
    <div>
      <h2 className="display-sm">{t.title}</h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/65">{t.intro}</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <TextField
          maxLength={FIELD_LIMITS.maxShortText}
          label={t.name}
          required
          value={b.name}
          error={errors.name}
          onChange={(e) => q.patchBuyer({ name: e.target.value })}
          autoComplete="name"
        />
        <TextField
          maxLength={FIELD_LIMITS.maxShortText}
          label={t.company}
          value={b.company}
          onChange={(e) => q.patchBuyer({ company: e.target.value })}
          autoComplete="organization"
        />
        <TextField
          maxLength={FIELD_LIMITS.maxPhone}
          label={t.phone}
          type="tel"
          inputMode="tel"
          value={b.phone}
          error={errors.contact}
          onChange={(e) => q.patchBuyer({ phone: e.target.value })}
          autoComplete="tel"
        />
        <TextField
          maxLength={FIELD_LIMITS.maxPhone}
          label={t.whatsapp}
          type="tel"
          inputMode="tel"
          value={b.whatsapp}
          onChange={(e) => q.patchBuyer({ whatsapp: e.target.value })}
        />
        <TextField
          maxLength={FIELD_LIMITS.maxEmail}
          label={t.email}
          type="email"
          inputMode="email"
          value={b.email}
          error={errors.email}
          onChange={(e) => q.patchBuyer({ email: e.target.value })}
          autoComplete="email"
          className="sm:col-span-2"
        />
        <TextArea
          maxLength={FIELD_LIMITS.maxNotes}
          label={t.notes}
          rows={4}
          placeholder={t.notesPlaceholder}
          value={q.request.notes}
          onChange={(e) => q.patchRequest({ notes: e.target.value })}
          className="sm:col-span-2"
        />
      </div>

      {siteConfig.features.marketingEnabled && (
        <label className="mt-8 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={q.request.marketingConsent}
            onChange={(e) => q.patchRequest({ marketingConsent: e.target.checked })}
            className="h-5 w-5 shrink-0 accent-[var(--color-gold)]"
          />
          <span className="text-ink/75">{t.consent}</span>
        </label>
      )}

      <p className="mt-8 text-xs text-ink/60">{copy.quote.form.privacy}</p>
    </div>
  );
}
