# SILVORA — Pre-launch checklist

Everything in this file is a **placeholder, an unconnected service, or a
demo value that must not go live**. Line numbers are accurate as of the
V4 production-readiness pass. Nothing here is a bug — the build
intentionally marks unknown business data rather than inventing it.

**Check progress at any time:**

```bash
npm run validate:data    # product data integrity
npm run launch:audit     # BLOCKERS / WARNINGS / READY, exits 1 on a blocker
npm run preflight        # validate → typecheck → lint → audit
```

The audit is the authority on what blocks a launch. This document
explains each item and where to fix it.

**Current state: 4 blockers** — canonical domain, quote delivery, legal
entity name, contact channels.

---

## What the build already refuses to do

Active now, no configuration needed. Each is load-bearing: removing one
would let the site mislead a real buyer.

| Protection | Where |
|---|---|
| Never reports a submitted quote without a real backend response | `lib/quote-service.ts`, `app/api/quote/route.ts` |
| Never shows an unverified (`demo`) figure in production — not on the page, not in the HTML source, not in structured data | `lib/demo-policy.ts` |
| Never renders a `tel:`, `wa.me` or `mailto:` built from a placeholder | `lib/contact.ts` |
| Never renders a document button without a valid URL | `lib/url-safety.ts` |
| Never publishes example.com / localhost as canonical without an error in the build log | `lib/site-url.ts` |
| Never sends personal data to analytics | `lib/analytics.ts` |
| No stock counts, no scarcity, no fake pricing, no fake ratings | by design, throughout |

---

## 0. BLOCKER — The quote backend

**A production build cannot deliver an enquiry until this is done.**

`/api/quote` validates, persists, then notifies. With nowhere to put a
request it answers **503 `not_configured`**, and the site tells the
visitor plainly that nothing was sent, handing them the summary to send
themselves.

**To connect it — no code change required:**

```bash
# Durable storage. This decides whether a submission counts as delivered.
QUOTE_WEBHOOK_URL=https://api.your-domain/silvora/quotes
QUOTE_WEBHOOK_SECRET=…            # optional bearer token

# Sales notification (any JSON mail API; Resend's shape by default)
QUOTE_EMAIL_API_KEY=…
QUOTE_EMAIL_FROM=quotes@your-domain
QUOTE_EMAIL_TO=sales@your-domain
QUOTE_EMAIL_CONFIRM_BUYER=true    # optional buyer acknowledgement
```

Then set `features.quoteServiceMode` to `"api"`
(`data/site-config.ts` line 154) — while it is `"mock"` the audit fails
and a production build refuses to submit.

Contract and worked example: [`docs/QUOTE-API.md`](docs/QUOTE-API.md).
Supabase and Postgres adapter sketches: bottom of
`lib/server/quote-sinks.ts`.

**Verified behaviour** (tested against a live receiver during V4):

| Situation | Result |
|---|---|
| Nothing configured | 503, no success shown |
| Store configured and reachable | 200 + server-issued reference |
| Store down | 502, **no success**, nothing lost |
| Notifier down, store up | 200 — the RFQ is safe, failure logged separately |
| Same request submitted twice | one record, same reference returned |
| Honeypot filled | plausible response, nothing stored |
| >12 requests / 10 min from one IP | 429 |
| Payload > 128 KB | 413 |
| Malformed JSON / invalid fields | 400 / 422 with per-field messages |

---

## 1. BLOCKER — Canonical domain

`NEXT_PUBLIC_SITE_URL` drives canonical tags, sitemap, robots, Open
Graph, structured data and every share URL. Still
`https://www.example.com` (line 105 is only the fallback — set the
environment variable).

`lib/site-url.ts` normalises it, strips trailing slashes, and logs an
error during a production build if it is missing, invalid, http, or
points at example.com / localhost.

---

## 2. BLOCKER — Legal identity

Brand and legal entity are separate concepts. `SILVORA` is what
customers read; the legal name belongs only in Organization structured
data, the legal pages, the footer copyright and printed quote documents.

| Line | Field | Current |
|---|---|---|
| 92 | `legal.name` | `"Silvora"` — placeholder. **Do not invent a registered name.** |
| 93 | `legal.copyrightName` | empty → falls back to the brand |
| 94 | `legal.registrationNumber` | empty (emitted as `identifier` when set) |
| 95 | `legal.taxNumber` | empty (emitted as `taxID` when set) |
| 96 | `legal.businessType` | empty |

Legal copy in `data/copy.ts` (privacy / terms / cookies) is template
text. It must describe what you actually do with RFQ data: what is
collected, why, where it is stored, for how long, and who to contact.
The RFQ collects name, company, phone, WhatsApp, email, location and
free text — the privacy page must say so. Do not claim a jurisdiction or
a compliance regime you have not verified.

---

## 3. BLOCKER — Contact channels

All three are placeholders, so no phone, WhatsApp or email action
renders anywhere. If the RFQ fails, a buyer has no way to reach you.

| Line | Field | Current | Effect while unset |
|---|---|---|---|
| 109 | `contact.email` | `sales@example.com` | shown as text, no `mailto:` |
| 111 | `contact.phone` | `+00 000 000 0000` | shown as text, "Call sales" hidden |
| 117 | `contact.whatsapp` | `0000000000` | every WhatsApp button hidden |
| 119 | `contact.office` | placeholder text | shown as-is |
| 120 | `contact.farm` | placeholder text | shown as-is |
| 121 | `contact.businessHours` | `Mon – Sat · 08:00 – 17:00` | confirm these are real |
| 123 | `contact.mapEmbedUrl` | empty | placeholder panel on /contact |

WhatsApp must be digits only, full international format, **no leading
`+`** (e.g. `9647510000000`). No country code is ever guessed.

Social links (lines 128–131) are all `"#"` and filtered out of the
footer. Add real URLs or delete the entries.

---

## 4. Service areas

`serviceAreas` (line 144) is empty, so logistics copy stays generic —
safe and honest. Nothing assumes national delivery.

```ts
serviceAreas: [
  {
    name: "Erbil Governorate",
    country: "Iraq",
    deliveryAvailable: true,
    pickupAvailable: true,
    commercialOnly: false,
    note: "Full loads preferred",
  },
],
```

---

## 5. Product measurements — real operational data

**Weights and dimensions must be measured, not looked up.** A buyer plans
handling equipment, trailer loads and storage around them. Do not copy a
baler manufacturer's brochure.

All 9 products carry unverified figures (9 specs each; 6 for
`bulk-custom-order`). In production these are **hidden entirely**, so
product pages currently show **zero** specification rows. That is correct
behaviour, and the strongest possible incentive to go and measure.

```ts
weightMeasurement: {
  nominal: 750, minimum: 700, maximum: 800,
  unit: "kg",
  tolerance: "±5% with moisture",
  measurementBasis: "actual-sample",   // production-average | batch-specific | supplier-declared
  measuredAt: "2026-09-14",
  demo: false,                          // ← the flag that makes it visible
},
```

The data model may be more precise than the UI. Remove `demo: true` only
once a number is verified — `npm run validate:data` flags anything
marked verified that still reads like a placeholder.

**Known limit:** `data/products.ts` is imported directly by client
components (catalogue filter, homepage signature bale, search), so
unverified values remain in the JavaScript bundle even though they are
absent from the page and the HTML source. The only complete fix is
replacing them with measured values.

---

## 6. Batch records and laboratory data

**Nutrition belongs to a batch, never to a product.** A fermented crop is
not identical bale to bale, so a product-wide "nutritional profile"
would be a false claim. The model enforces this.

No product has batch records, so the batch section renders nothing.

```ts
batches: [
  {
    code: "SLV-2026-A-014",
    harvestSeason: "2026 first cut",
    origin: "Erbil Governorate",
    fieldReference: "Plot 7",         // internal, not shown publicly
    cropVariety: "…",
    harvestDate: "2026-09-14",
    packingDate: "2026-09-15",
    labDate: "2026-09-22",
    labProvider: "…",
    labReportUrl: "/docs/batch-2026-A-014.pdf",
    labStatus: "available",            // pending | not-tested | superseded
    nutrition: {
      dryMatter: { value: 34.2, unit: "%", method: "oven" },
      starch: { value: 31.5, unit: "% DM", method: "NIR" },
    },
    demo: false,
  },
],
```

Several batches per product are supported; only populated fields render.
Where no lab report exists the UI asks for **Request lab data** instead
of offering a download — the honest state, not a fallback.

`/quality` still shows `DEMO-BATCH-A` (`data/lab-data.ts` lines 45–59),
hidden in production.

---

## 7. Product documents

Buttons render only when a valid URL is configured, so there are no
broken downloads. No product has any.

```ts
documents: {
  specSheetUrl: "/docs/premium-round-bale-spec.pdf",
  labReportUrl: "/docs/premium-round-batch-2026-A.pdf",
  handlingGuideUrl: "…",
  storageGuideUrl: "…",
  certificates: [{ label: "Phytosanitary certificate", url: "/docs/phyto.pdf" }],
  meta: { specSheetUrl: { fileType: "pdf", fileSize: 430080 } },  // → "PDF · 420 KB"
},
```

Files go in `public/docs/`. `meta` is optional and only rendered when
set — file sizes are never estimated. `""`, `"#"`, `javascript:` and
malformed URLs are rejected by `lib/url-safety.ts` and reported by
`npm run validate:data`.

**Never generate a certificate or a laboratory report.** If it does not
exist as a real document, it does not exist.

---

## 8. Availability

A supply state, shown as wording and never as a count:

`available` · `limited` · `preorder` · `seasonal` · `contact` · `unavailable`

Optional: `availabilityNote`, `availableFrom`, `availableUntil`,
`harvestSeason`. There is deliberately no way to express "only 3 left" —
do not add one. Review each product against reality before launch.

---

## 9. Photography

**All 56 images are prototype stock from Unsplash. Zero are owned.** After
the blockers, this is the highest-value remaining work.

1. Master image → crop to the ratio that key uses
2. Export ~2400px wide, quality 80 (Next re-encodes to AVIF/WebP)
3. Save to `public/media/<key>.jpg`
4. Set `src: "/media/<key>.jpg"`, update `alt`, add `owned: true`,
   `photographer`, `license`

**Do not bake colour grading into source files.** The `graded` treatment
in `styles/globals.css` is what makes mixed material read as one SILVORA
shoot, and it applies to owned photography too.

Priority: `homeHero` → `baleEnd` (the sticky bale; an isolated cut-out on
transparent or near-black would let the circular mask be dropped
entirely) → `baleClose` → product primaries.

When Unsplash is gone, remove it from `next.config.ts` — both the
`remotePatterns` entry and `IMAGE_ORIGINS`, which tightens the CSP
automatically.

---

## 10. Analytics and consent

No provider is wired. `lib/analytics.ts` is a typed no-op bus with twelve
events already firing across the site.

1. `features.analyticsEnabled: true` (line 171)
2. `setAnalyticsSink(…)` once from a client component near the root —
   Plausible, PostHog and GA4 examples are in the file header
3. Load the provider script yourself

**Privacy is enforced, not documented:** `track()` passes only an
allowlist of keys and buckets quantities. Names, phones, emails,
addresses, free text and the quote reference can never reach a provider.

**Consent:** `needsConsentUi()` is false while `analyticsEnabled` and
`marketingEnabled` (line 172) are both off, so no cookie banner appears —
correctly, because nothing is tracked. Turning either on means adding
consent UI and updating the privacy page.

---

## 11. Trust signals and case studies

Both ship empty and render nothing:

- `data/trust.ts` — certifications, lab partners, farm partners, client
  logos, testimonials (testimonials also require `approved: true`)
- `data/case-studies.ts` — `/results` returns **404** while empty and is
  absent from the navigation and sitemap

Get publication permission in writing before adding either.

---

## 12. Brand assets

| Asset | Location | State |
|---|---|---|
| Logo / symbol / wordmark | `components/ui/Logo.tsx` (inline SVG) + `public/logo/*.svg` | approved SILVORA identity |
| Favicon | `app/icon.svg` | derived from the logo |
| Default OG image | `public/og.jpg`, referenced at line 201 | **prototype artwork — replace with a real 1200×630** |
| Product OG images | `app/products/[slug]/opengraph-image.tsx` | generated per product, brand colours, no fake data |
| Twitter handle | line 202 | empty (handled correctly) |

Do not redesign the logo. To replace the favicon, edit `app/icon.svg`.

---

## 13. Feature flags

All in `data/site-config.ts` `features` (line 153). Prefer real values
over flags: a channel also needs a non-placeholder value to appear.

| Line | Flag | Default | Note |
|---|---|---|---|
| 154 | `quoteServiceMode` | `"mock"` | **must become `"api"`** |
| 159 | `quoteEndpoint` | from env | empty = use `/api/quote` |
| 161 | `quoteEnabled` | `true` | master switch for the RFQ |
| 167–169 | `whatsappEnabled` / `phoneEnabled` / `emailEnabled` | `true` | can only turn a channel off |
| 171–172 | `analyticsEnabled` / `marketingEnabled` | `false` | |
| 173–177 | `searchEnabled`, `savedProductsEnabled`, `specSheetsEnabled`, `availabilityEnabled`, `batchDataEnabled` | `true` | |
| 186 | `showDemoValues` | `true` | development only — **forced off in production** |

---

## 14. Security

`next.config.ts` sets Content-Security-Policy,
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`, plus `no-store` and `noindex` on `/api/*`.

The CSP is moderate on purpose — Next.js needs `'unsafe-inline'` for its
styles, and a CSP that breaks the framework gets switched off by the next
developer. External origins are listed once in `IMAGE_ORIGINS` so the CSP
and the image config cannot drift apart.

RFQ protections: server-side validation of every field, a 128 KB body
cap, a per-IP rate limit (12 / 10 min, tunable via `QUOTE_RATE_MAX` and
`QUOTE_RATE_WINDOW_MS`), idempotency keys, a quiet honeypot and a timing
check. **No CAPTCHA** — buyers on rural connections must not be
challenged.

Rate limiting and idempotency are in-process. Across several instances
each holds its own counters, which weakens both but never rejects a
legitimate request. For strict guarantees, back them with Redis or
enforce uniqueness on the reference column in your database.

---

## 15. Delivery assumptions

The delivery planner and the RFQ delivery step collect requirements only.
Nothing quotes freight, promises an ETA or claims coverage. If you
publish service areas (§4), re-read that copy and confirm it still
matches what you can commit to.

The calculator's herd presets (`lib/calculator.ts`, `animalPresets`) are
planning starting points for daily intake, not a ration recommendation.
Have a nutritionist check them for your market.

---

## 16. Languages

| Locale | Path | Status |
|---|---|---|
| English | `/` | live (default, unprefixed) |
| العربية | `/ar` | live — draft, needs native review |
| کوردیی سۆرانی | `/ckb` | live — draft, needs native review |
| کوردیا بادینی | `/kmr` | **built but NOT live** |

All four are complete translations of the same 1,142 strings: UI copy,
9 products, 16 FAQs, the 8-step process, the comparison table,
navigation, labels, per-page metadata and the whole RFQ wizard.

**Infrastructure** (shared by every locale): one route tree under
`app/[locale]` plus a proxy rewrite, RTL layout, `hreflang` on every page
and in the sitemap, a switcher that stays on the same page across
languages, RTL-aware scroll maths, and Western digits everywhere.

Arabic-script typography: Amiri (display) + IBM Plex Sans Arabic (text),
with `uppercase`, letter-spacing and `italic` neutralised — all three are
meaningless or visibly broken in Arabic script.

### Badini is deliberately gated

`kmr` is absent from `activeLocales` in `data/locales.ts`, so `/kmr/*`
returns 404 and the switcher lists it as unavailable. Nothing links to it.

This is not an oversight. Badini Kurmanji written in the Arabic script is
far less standardised than Sorani: orthography varies between Duhok,
Zakho and Amedi, ezafe and case marking are written inconsistently in
practice, and there is little published agricultural writing to follow.
The translation was produced with materially lower confidence than the
Arabic and Sorani, and it needs a Badini speaker to **rewrite** parts of
it, not merely proofread.

To enable it after review, add `"kmr"` to `activeLocales`. One line.

### Reviewing

```bash
npm run i18n:review
```

Writes one sheet per locale — `docs/AR-REVIEW.md`, `docs/CKB-REVIEW.md`,
`docs/KMR-REVIEW.md` — each listing every string beside its English
source and its `data/` path, with per-language guidance at the top. It
also flags any translation byte-identical to the English (currently zero
in all three).

`npm run validate:data` checks that every locale's product overlay,
FAQ array and process array line up with the English source.

Legal pages (privacy / terms / cookies) are translated in their UI
framing, but their body text remains the English placeholder — a lawyer
is rewriting it anyway (§2).

---

## 17. Ship checklist

Configuration:

- [ ] `NEXT_PUBLIC_SITE_URL` is the real https domain
- [ ] `legal.name` is the registered entity
- [ ] Phone, WhatsApp and email are real
- [ ] `quoteServiceMode` is `"api"` and a destination is configured
- [ ] Product weights and dimensions measured, `demo` removed
- [ ] Legal pages reviewed against what you actually do with RFQ data

Verification:

- [ ] `npm run preflight` passes with **zero blockers**
- [ ] `npm run build` clean
- [ ] Sitemap, robots and canonical show the real domain — checked on the
      live site, not in source
- [ ] A real test RFQ (buyer name `SILVORA LAUNCH TEST`) arrives, for each
      of the four order types
- [ ] The confirmation shows "Request received" with a `SLV-…` reference
      matching the stored record
- [ ] The notification email is readable on a phone and replies to the buyer
- [ ] WhatsApp buttons are visible and open the right account
- [ ] Footer phone and email are links, not plain text
- [ ] No `DEMO` badge anywhere on the live site
- [ ] Open Graph preview renders when a product URL is pasted into WhatsApp
- [ ] Quote survives a refresh mid-flow; "clear request" empties it
- [ ] Print the review step — one or two clean pages
- [ ] `docs/AR-REVIEW.md` reviewed by a native Arabic speaker
- [ ] `docs/CKB-REVIEW.md` reviewed by a native Sorani speaker
- [ ] `docs/KMR-REVIEW.md` reviewed (and partly rewritten) by a Badini speaker, before `kmr` is added to `activeLocales`
- [ ] RTL pages checked at 390px — layout, no clipped headlines
- [ ] Arabic-script fonts render Kurdish letters (ڕ ڵ ۆ ێ ژ چ پ گ) with no missing glyphs
- [ ] 390px: complete an RFQ with the keyboard open; the sticky bar never
      covers an input
