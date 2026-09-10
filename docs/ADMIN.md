# Corn Fodder admin panel

A staff tool at `/admin`: an inbox for quote requests, and an editor for
product content. The public site works completely without it — nothing
below is required to launch.

---

## Setup

### 1. Database

Create a Supabase project (the free tier is ample), open the SQL editor
and run [`docs/sql/001-init.sql`](sql/001-init.sql). It creates four
tables and enables row-level security with **no policies**, so the anon
key can read and write nothing. Every access goes through the
service-role key on the server.

Then set:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=…
```

`SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security. It is a full
database credential — treat it like a root password, and never give it
a `NEXT_PUBLIC_` name.

**Setting these two closes the "no durable storage" launch blocker.**
Quote requests begin persisting immediately, whether or not anyone ever
signs into the panel.

### 2. Password

```
npm run admin:password
```

Prints a generated password plus the two values to add:

```
ADMIN_PASSWORD_HASH=scrypt:…
ADMIN_SESSION_SECRET=…
```

Save the password in a password manager — it is not stored anywhere and
cannot be recovered. Pass your own instead with
`npm run admin:password -- "your password"` (minimum 12 characters).

Restart, then sign in at `/admin/login`.

> Locally, put these in `.env.local` (gitignored). Exporting them in a
> shell before `next start` does not reliably reach the server process.

---

## How authentication works

One shared password, hashed with scrypt, exchanged for an HMAC-signed
session cookie. Node's own crypto does all of it — no dependency.

- The cookie is HttpOnly, `SameSite=Strict`, `Secure` in production,
  scoped to `/admin`, and valid for **8 hours**.
- The gate is in [`proxy.ts`](../proxy.ts), not in a layout, so a new
  route under `/admin` is protected the moment it exists. A layout would
  not run for route handlers, leaving the CSV export unguarded.
- There is no session table, so a single session cannot be revoked.
  **Rotating `ADMIN_SESSION_SECRET` signs everyone out at once** — that
  is the revocation mechanism.
- Login is throttled to 8 attempts per 15 minutes per IP, in-process.
  On several instances each holds its own counter, so this raises the
  cost of guessing rather than eliminating it. The password still has to
  be strong.

**Sized for a handful of trusted staff at one company.** The audit log
records `admin`, not a person. If more people need access, or you need
to know who changed what, move to per-person accounts.

---

## The inbox

`/admin/requests`. Filters live in the URL, so a filtered view can be
bookmarked and shared. Search covers reference, company, buyer name,
email and phone.

Each request moves through `new → reviewing → quoted → won / lost`, plus
`spam`. Internal notes are staff-only and never shown to the buyer.

**CSV export** contains names, phone numbers and email addresses. A
download is a copy of personal data leaving the system; do not email it
around or leave it in a shared folder. Fields beginning `=`, `+`, `-` or
`@` are prefixed with an apostrophe so a spreadsheet cannot execute a
buyer-supplied string as a formula.

---

## Enquiries

`/admin/contacts`. Messages from the general contact form, kept apart
from quote requests on purpose: an enquiry has no products, no delivery
and no order type, and it moves through `new → replied → closed` rather
than the quote states.

They land in `contact_requests`, get a `CFC-` reference, and are subject
to the same rule as everything else — nothing is reported as sent unless
something durable accepted it. If no store is configured but a sales
mailbox is, the email becomes the delivery mechanism and must succeed.

> **This form was broken before.** `/api/quote` ignored the envelope's
> `type` and validated every submission with `validateQuoteRequest`, so
> a contact message failed on the missing `orderType`, `products` and
> `delivery` and came back 422 every time. The route now branches on
> `type` and enquiries have their own validator, store and screen.

---

## The product editor

**The database does not hold products. It holds patches.**

```
data/products.ts            the committed catalogue
  ↓
data/{ar,ckb,kmr}/…         the file translation overlays
  ↓
product_overrides "en"      base patch — facts, every language
  ↓
product_overrides "<loc>"   translation patch — text, one language
```

Consequences:

- **An empty table renders exactly what is in git.** Reverting the whole
  panel is `delete from product_overrides`.
- **Static generation survives.** Product pages are cached under a tag
  and rebuilt when you publish, not on every request. The build still
  prerenders all 89 pages.
- **If the database is down, the site falls back to the committed
  catalogue.** The panel cannot take the public site offline; the worst
  case is that it shows what it showed before the panel existed.

### The two layers

| Layer | What belongs there |
|---|---|
| **English (base)** | Availability, harvest dates, specification values — facts. Changing one changes every language, which is the point: a bale's availability is not a translation. |
| **Other locales** | Text only. Anything left blank falls back to English. |

### What cannot be edited

Slug and id (identity — changing a slug breaks every inbound link and
every stored quote line), images (keys into `data/media.ts`), and the
machine keys `format` / `application` / `orderType` that drive the
filters, search and Bale Finder. Batches and nutrition come from a
laboratory, not a form.

### The `demo` marker

Every measurement in the catalogue is marked `demo: true` until it is
replaced with a real one, and demo values are hidden in production.

**Typing a new value into a specification row on the English record
clears that marker.** That is how the site stops showing placeholders —
and why you must only do it for figures that were actually measured. A
translation never clears it: rewording a number in Kurdish does not make
it measured.

### What a publish does and does not reach

An edit is live on the product page and in its `<title>`, description,
canonical and Open Graph tags as soon as you publish.

**The share-card image is not regenerated.** `opengraph-image.tsx`
renders from the committed catalogue, so a name changed in the panel
still shows the old name in the picture a link preview draws. Change it
in `data/products.ts` and commit if that matters for a campaign.

### Validation

[`lib/product-schema.ts`](../lib/product-schema.ts) defines what a patch
may contain, and is imported by both the editor and
`scripts/validate-data.mts`. The browser form and the command-line check
cannot disagree. Nothing is saved while a field is invalid.

### Translations and the review documents

`docs/AR-REVIEW.md`, `docs/CKB-REVIEW.md` and `docs/KMR-REVIEW.md` are
generated from the files in `data/<locale>/`. **An edit made in the
panel will not appear in them.** The editor says so when you open an
unreviewed locale. For a substantial translation change, edit the file
and commit it; use the panel for corrections.

---

## Operational notes

- `/admin` is excluded from locale rewriting in `proxy.ts` — without
  that carve-out, `/admin` would be rewritten to `/en/admin` and 404.
- The panel does not load `styles/globals.css` (~98 KB of marketing
  design tokens) or any of the public providers, and it uses system
  fonts. Admin JavaScript never reaches the public bundles.
- `/admin/*` is `noindex, nofollow` and `no-store` in three places:
  `proxy.ts`, `next.config.ts` and `robots.txt`.
- `npm run launch:audit` checks the panel's configuration, and **fails
  the build** if any of these secrets is given a `NEXT_PUBLIC_` name.
  Note that the audit runs under plain Node and does not read
  `.env.local` — it reports what the real deployment environment has.

## Recovering access

Lost the password: run `npm run admin:password` again and replace both
values. Everyone is signed out and the new password works immediately.

Suspected compromise: rotate `ADMIN_SESSION_SECRET` first — that
invalidates every existing session — then rotate the password, then
rotate `SUPABASE_SERVICE_ROLE_KEY` in the Supabase dashboard.
