# SILVORA — Premium Corn Silage Bales

A production-quality Next.js website for a premium corn silage bale supplier.
Cinematic, editorial, mobile-first, quote-driven — and built so that every
piece of content (brand, products, copy, imagery, contact details) lives in
a small set of data files you can edit without touching the UI.

```
Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4
Framer Motion 12 · Lucide icons · next/font · next/image
```

---

## 1. Installation

```bash
# Node 20.9+ (Node 22 recommended)
npm install
```

Copy the example environment file and adjust it:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public URL used for canonical links, Open Graph and the sitemap. |
| `NEXT_PUBLIC_FORMS_ENDPOINT` | Optional. When set, quote and contact forms POST JSON here (see §9). |

## 2. Development

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # strict TypeScript
npm run lint       # ESLint (next/core-web-vitals + typescript)
```

## 3. Build & run

```bash
npm run build
npm run start
```

## 4. Deployment

The project is a standard Next.js app with one API route
(`/api/quote`), so it needs a Node runtime — not a static export.

* **Vercel** — import the repository, set the environment variables, deploy.
* **Netlify / Cloudflare / Railway / Render** — use their Next.js adapter.
* **Docker / VPS** — `npm ci && npm run build && npm run start` behind a
  reverse proxy.

`output: "export"` is **not** supported: a static export has no server, so
the RFQ endpoint disappears and no enquiry can be delivered.

---

## 4a. Production launch procedure

Work through this in order. Steps 1–6 are configuration, 7–9 verify it,
10–15 confirm the live site. `PRE-LAUNCH.md` has the file:line reference
for every placeholder mentioned here.

**1. Configure the domain**

```bash
NEXT_PUBLIC_SITE_URL=https://silvora.example   # no trailing slash, https
```

Anything else (example.com, localhost, http) is a launch blocker —
`lib/site-url.ts` refuses it and the build log says so.

**2. Configure the environment**

Copy `.env.example`, fill it in, and set the same values on the host.
Server secrets must never carry the `NEXT_PUBLIC_` prefix.

**3. Replace the contact information**

`data/site-config.ts` → `contact` and `legal`. Placeholder phone,
WhatsApp and email produce no clickable action anywhere on the site, so
nothing breaks while they are unset — but nobody can reach you either.

**4. Replace the demo product data**

Every unverified figure carries `demo: true` and is **hidden in
production**. Until real measurements are entered, product pages show no
specifications. Weigh and measure actual bales; do not copy a baler
brochure. See `PRE-LAUNCH.md` §5 and §7.

**5. Configure the quote API**

Implement or point at a destination — `QUOTE_WEBHOOK_URL` for storage,
`QUOTE_EMAIL_*` for sales notification. Contract and example payloads:
`docs/QUOTE-API.md`. With nothing configured, `/api/quote` answers 503
and the site tells visitors their request was not sent.

**6. Configure notification**

At least one of `QUOTE_EMAIL_*` or `QUOTE_NOTIFY_WEBHOOK_URL`, so a new
RFQ reaches a person rather than sitting in a table.

**7. Validate the data**

```bash
npm run validate:data
```

Duplicate slugs, missing images, malformed document URLs, batches
without codes, dates in the wrong order. Exits non-zero on any error.

**8. Run the launch audit**

```bash
npm run launch:audit
```

Prints BLOCKERS / WARNINGS / READY and exits non-zero while a blocker
remains. Warnings (no analytics, no case studies, stock photography) do
not block a deploy.

`npm run preflight` runs validate → typecheck → lint → audit in one go.

**9. Build**

```bash
npm run build
```

**10. Deploy**

**11. Verify sitemap, robots and canonical on the live site**

```bash
curl -s https://your-domain/sitemap.xml | head
curl -s https://your-domain/robots.txt
curl -s https://your-domain/ | grep -o '<link rel="canonical"[^>]*>'
```

No `example.com`, no `localhost`, one canonical per page.

**12. Submit a real test RFQ**

Use an obvious marker so it is never mistaken for a lead — buyer name
`SILVORA LAUNCH TEST`. Run one of each order type: farm, commercial,
distributor, export. Confirm the confirmation screen shows **Request
received** with a `SLV-…` reference, and that the reference matches the
stored record (the server issues it, not the browser).

**13. Verify the notification**

The internal email or webhook arrives, is readable on a phone, and the
reply-to is the buyer's address.

**14. Verify print**

Open the review step, print to PDF: branding, reference, buyer, lines,
requirements, delivery. No navigation, no imagery, no sticky bars.

**15. Verify mobile**

At 390px: complete an RFQ end to end with the on-screen keyboard open,
check the sticky bar never covers an input, and confirm the request
survives a refresh mid-flow.

---

## 4b. Staging vs production

| | Staging | Production |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | staging origin | real domain |
| `quoteServiceMode` | `mock` is fine | must be `api` |
| Quote destination | test webhook / test inbox | real store + real notifier |
| Product data | demo values acceptable | measured values only |
| Contact details | placeholders acceptable | real |

Mock mode **cannot** be deployed to production by accident: a
production build downgrades it to `unconfigured` and refuses to report a
successful submission. Combined with the launch audit — which fails the
command with a non-zero exit while `quoteServiceMode` is `mock` — a
staging configuration cannot quietly ship as production.

Keep test RFQs marked. `SILVORA LAUNCH TEST` in the buyer name is
enough, and it keeps genuine leads clean.

---

## 5. Project structure

```
app/                      Routes (App Router)
  layout.tsx              Fonts, providers, header/footer, JSON-LD
  page.tsx                Homepage (15 sections)
  products/               /products and /products/[slug]
  quality/ logistics/ about/ process/ contact/ quote/
  privacy/ terms/ cookies/ Legal placeholders
  not-found.tsx           404
  robots.ts sitemap.ts    SEO
  icon.svg                Favicon
components/
  layout/                 Header, MobileMenu, Footer, PageHero, MobileQuoteBar…
  home/                   One file per homepage section
  products/               Cards, catalogue + filters, gallery, buy box, details
  forms/                  QuoteForm, ContactForm
  quote/                  QuoteDrawer (the quote "cart")
  ui/                     Button, Field, Accordion, Drawer, Reveal, Logo…
  seo/                    JsonLd
data/                     ← EVERYTHING YOU EDIT LIVES HERE
  site-config.ts          Brand name, contact, socials, service areas, language
  products.ts             The catalogue
  media.ts                Every image on the site
  copy.ts                 All interface / section copy (English)
  faqs.ts                 FAQ content
  navigation.ts           Header, footer and legal links
  process.ts              "From field to feed" steps
  comparison.ts           Format comparison table
  lab-data.ts             Laboratory analysis structure (demo batches)
  about.ts                Company fact sheet (empty until you fill it)
lib/
  quote-store.tsx         Quote cart (React context + localStorage)
  quote-service.ts        Form submission abstraction (demo / HTTP / your backend)
  calculator.ts           Silage requirement maths
  bale-finder.ts          Deterministic "Find your bale" rules
  seo.ts                  Metadata + JSON-LD builders
  i18n.ts                 Locale registry (en / ar / ku, RTL-ready)
types/                    Product and quote types
styles/globals.css        Design tokens, typography scale, utilities
public/logo/              Static logo SVGs (light / dark / gold / horizontal)
public/og.jpg             Open Graph image (replace with your own 1200×630)
```

---

## 6. Where to edit branding

**`data/site-config.ts`** — change `brandName`, `brandNameDisplay`,
`legalName`, `descriptor`, `tagline`, `statement` and `footerLine`.
Every component reads from this file; nothing brand-specific is hard-coded.

**Logo** — the mark is drawn in `components/ui/Logo.tsx` (a wrapped bale
with a maize-leaf "S"). Static exports are in `public/logo/`. Replace the
SVG paths there and in `Logo.tsx` to change the mark; the favicon is
`app/icon.svg`.

**Slogan** — `siteConfig.tagline` ("Harvested for Performance.") is used in
the footer and metadata.

## 7. Where to edit contact information

`data/site-config.ts → contact`: phone, WhatsApp number (digits only, used
for the `wa.me` link), email, office, farm, business hours and an optional
Google Maps `mapEmbedUrl`. Social links live in `siteConfig.socials`
(set `href` to real URLs). Service areas live in `siteConfig.serviceAreas`
— leave the array empty until you are ready to publish coverage.

## 8. Where to edit products

`data/products.ts`. Each product has a strong TypeScript shape
(`types/product.ts`) — name, slug, format, application, order type, images,
specs, storage, handling, delivery notes, FAQ and related products.

Every number in the shipped catalogue is a **DEMO placeholder** marked
`demo: true`. Replace the value and remove the flag; the small "DEMO"
marker disappears automatically.

### How to add another product

1. Copy an existing entry in `data/products.ts`.
2. Give it a unique `id` and `slug` (the slug becomes the URL).
3. Choose `format`, `application[]` and `orderType[]` — these drive the
   filters and the Bale Finder.
4. Pick images from `data/media.ts` (add new keys there first if needed).
5. Done. The product now appears in the grid, filters, related products,
   sitemap, structured data and the quote form's product list.

Labels for formats / applications / order types are in the same file
(`formatLabels`, `applicationLabels`, `orderTypeLabels`).

## 9. The quote backend

```
QuoteWizard → lib/quote-service.ts → POST /api/quote
                                       ├── validation   lib/server/validate-quote.ts
                                       ├── guards       lib/server/guards.ts
                                       ├── reference    lib/server/reference.ts
                                       └── delivery     lib/server/quote-sinks.ts
                                             ├── store    (durable, decides success)
                                             └── notifier (email / webhook)
```

Components never call `fetch` — they call the service. The service posts
to `/api/quote` unless `NEXT_PUBLIC_FORMS_ENDPOINT` points elsewhere.

**To connect a destination**, set environment variables — no code
change:

* `QUOTE_WEBHOOK_URL` — durable storage. Decides whether a submission
  counts as delivered.
* `QUOTE_EMAIL_API_KEY` + `QUOTE_EMAIL_FROM` + `QUOTE_EMAIL_TO` — sales
  notification through any JSON mail API (Resend's shape by default).
* `QUOTE_NOTIFY_WEBHOOK_URL` — Slack, Teams, n8n, Zapier.

Supabase and Postgres adapter sketches are at the bottom of
`lib/server/quote-sinks.ts`; each is a ~15-line `QuoteStore`.

**Order of operations:** validate → persist → respond → notify. A
notification failure is logged and never loses a stored RFQ. When only
notifiers are configured, the notifier *is* the delivery mechanism and
must succeed.

**Protections:** server-side validation of every field, a per-IP rate
limit, a body-size cap, an idempotency key so a double-tap or a retry
after a timeout does not create two records, and a quiet honeypot plus
timing check. No CAPTCHA — buyers on rural connections must not be
challenged.

**The reference is issued by the server** (`SLV-YYMMDD-XXXX`) and
replaces the browser's draft label on success.

The quote basket and all wizard state live in `lib/quote-store.tsx`,
persisted under `silvora.quote.v2`.

## 10. Where to replace imagery

`data/media.ts` is the only place image URLs exist. Each asset has a `src`
and an `alt`. During the prototype the photographs are served from Unsplash
through `next/image`; to use your own:

1. Put files in `public/images/`.
2. Change `src` to `/images/your-file.jpg` and update `alt`.
3. (Optional) remove the Unsplash `remotePatterns` entry in `next.config.ts`.

Key assets: `homeHero`, `baleEnd` (the Perfect Bale), `baleClose`
(Signature Bale), per-page heroes (`productsHero`, `qualityHero`, …),
and the product galleries referenced by key in `data/products.ts`.

## 11. How to change colours

`styles/globals.css → @theme`. Tailwind 4 turns every `--color-*` token into
utilities (`bg-forest`, `text-gold`, `border-stone` …):

```css
--color-forest: #102a20;   /* deep forest */
--color-ink:    #0d100e;   /* near black  */
--color-gold:   #c9a45c;   /* harvest gold — used sparingly */
--color-cream:  #f5f1e7;   /* natural cream */
```

## 12. How to change fonts

`app/layout.tsx` loads two Google fonts through `next/font`
(self-hosted, no layout shift):

```ts
const display = Instrument_Serif({ … variable: "--font-display" });
const sans    = Manrope({ … variable: "--font-sans" });
```

Swap the imports for any `next/font/google` family (or `next/font/local`)
and keep the CSS variable names — `globals.css` maps them to
`font-display` / `font-sans` and the fluid type scale (`display-xl` …
`display-xs`, `eyebrow`, `lead`).

## 13. Where to edit copy

`data/copy.ts` holds every heading, label, button and paragraph, grouped by
section and page. Headlines are arrays — one item per line — so line breaks
are deliberate on every screen size. Product and FAQ text live in their own
data files.

## 14. Languages

Four locales, three of them live:

```
/products        English         (default, no prefix — existing URLs unchanged)
/ar/products     العربية
/ckb/products    کوردیی سۆرانی
/kmr/products    کوردیا بادینی   — built, NOT enabled (see below)
```

**How it works**

One set of route files lives under `app/[locale]`. `middleware.ts`
rewrites unprefixed paths onto `/en/…` internally, so English keeps its
original URLs while Arabic gets real, shareable, indexable ones.

Content resolution:

```
data/copy.ts          English source of truth
data/ar/*.ts          Arabic — an OVERLAY, language only
data/dictionaries.ts  merges them into one Dictionary per locale
```

Products are translated by an overlay keyed by slug, never by a
duplicated catalogue: slugs, ids, images, formats, measurements, `demo`
flags and availability all stay in `data/products.ts`. A measured bale
weight therefore *cannot* differ between the English and Arabic pages,
because there is only one of it.

Reading the content:

| Where | Use |
|---|---|
| Server component | `getCopy()` / `getDictionary()` from `lib/dictionary.ts` |
| Client component | `useCopy()` / `useDict()` from `lib/locale-client.tsx` |
| Any link | `LocaleLink` (`components/ui/LocaleLink.tsx`) — hrefs stay unprefixed everywhere |

`setRequestLocale(locale)` must be called in **every page**, not just the
layout: Next renders route segments independently, so a layout-only call
leaves nested server components on the default locale. (This was a real
bug — the homepage trust strip rendered English inside the Arabic page.)

**Typography.** Amiri (display) + IBM Plex Sans Arabic (text), swapped by
a `[dir="rtl"]` block in `styles/globals.css`. That block also
neutralises `uppercase`, letter-spacing and `italic`, which are
meaningless or broken in Arabic. No component names a typeface.

**Numerals** stay Western (0–9) in every locale — see `intlLocale` in
`data/locales.ts`.

**Reviewing a translation**

```bash
npm run i18n:review     # → docs/AR-REVIEW.md, CKB-REVIEW.md, KMR-REVIEW.md
```

One sheet per locale: every string beside its English source and its
`data/` path, with per-language guidance at the top. Flags anything
byte-identical to the English.

**Badini is gated on purpose.** `kmr` is absent from `activeLocales`, so
`/kmr/*` 404s and the switcher shows it as unavailable. Kurmanji in the
Arabic script is not standardised enough to publish without a native
speaker rewriting parts of it — see the header of `data/kmr/copy.kmr.ts`.
Enabling it is one line, after `docs/KMR-REVIEW.md` is reviewed.

**Adding a locale**

1. `data/<code>/` mirroring `data/ar/`
2. register it in `data/dictionaries.ts`
3. add the code to `activeLocales` in `data/locales.ts`

Nothing else changes — routing, hreflang, the sitemap and the switcher
all read that list. A locale in `siteConfig.languages` but *not* in
`activeLocales` appears in the switcher as unavailable rather than
linking to a half-translated page.

---

## 15. Honesty rules baked into the build

These are enforced by code, not by convention. Each one is load-bearing:
removing it would let the site mislead a real buyer.

* **No success without delivery.** A production build reports "Request
  received" only after a configured destination accepted the request.
  With none configured, `/api/quote` answers 503 and the UI says so.
  Mock mode is downgraded automatically in production.
  (`lib/quote-service.ts`, `app/api/quote/route.ts`)
* **No unverified figures in production.** Anything marked `demo: true`
  — weights, dimensions, nutrition, moisture — is hidden entirely in a
  production build, including from screen readers and structured data.
  (`lib/demo-policy.ts`)
* **No dead actions.** Placeholder phone, WhatsApp and email render as
  plain text; the button or link simply is not there. (`lib/contact.ts`)
* **No broken downloads.** A document button exists only when a valid
  URL is configured. `#`, `javascript:` and malformed values are dropped.
  (`lib/url-safety.ts`)
* **No stock counts and no scarcity.** Availability is a supply state.
  There is no way to express "only 3 left".
* **Batch-first lab data.** Nutrition belongs to a batch, never to a
  product — a fermented crop is not identical bale to bale.
* **No PII in analytics.** Events pass through an allowlist; quantities
  are bucketed. (`lib/analytics.ts`)
* No fabricated certifications, customer counts, tonnage, countries,
  awards, testimonials, reviews, ratings, years in business or partner
  logos. Empty arrays render nothing rather than placeholders.
* Structured data never includes prices, ratings or demo specifications.
* Legal pages are clearly-marked placeholders.

## 16. Accessibility & performance notes

* Keyboard-navigable header, menu, drawers (focus trap, Escape, focus
  restore), accordions and forms; visible gold focus rings.
* `prefers-reduced-motion` disables entrance animation, parallax and the
  scroll-driven Perfect Bale rotation.
* Below-the-fold sections use `content-visibility: auto`; interactive
  sections are code-split; only the animation features in use are loaded
  (`LazyMotion`).
* Lighthouse (local, production build): desktop 100/100/100/100,
  mobile ~90+ performance with 100 accessibility / best practices / SEO.
  Real-world results depend on hosting and image CDN.

---

© SILVORA. Prototype photography via Unsplash (free licence) — replace
before commercial launch.
