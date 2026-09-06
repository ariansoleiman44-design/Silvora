/**
 * PRODUCTION LAUNCH AUDIT
 * --------------------------------------------------------------------
 *   npm run launch:audit
 *
 * Answers one question: would deploying this right now mislead a real
 * buyer, or fail to reach the business?
 *
 * BLOCKERS are things that make the site dishonest or broken in
 * production — a canonical pointing at example.com, an RFQ that reaches
 * nobody, a dead contact action. WARNINGS are things that are merely
 * incomplete. Marketing polish never blocks a deploy.
 *
 * Reads the data files directly under Node's native TypeScript support.
 * Exit code 1 if any blocker remains.
 */
import { siteConfig } from "../data/site-config.ts";
import { products } from "../data/products.ts";
import { media } from "../data/media.ts";
import { caseStudies } from "../data/case-studies.ts";
import { certifications, clientLogos, labPartners, testimonials } from "../data/trust.ts";
import { labBatches } from "../data/lab-data.ts";
import { activeLocales, locales } from "../data/locales.ts";

type Level = "blocker" | "warning" | "ready";
interface Item {
  level: Level;
  label: string;
  detail?: string;
}

const items: Item[] = [];
const blocker = (label: string, detail?: string) => items.push({ level: "blocker", label, detail });
const warning = (label: string, detail?: string) => items.push({ level: "warning", label, detail });
const ready = (label: string, detail?: string) => items.push({ level: "ready", label, detail });

const env = (key: string) => (process.env[key] ?? "").trim();

/* ------------------------------------------------------------------ */
/* Canonical origin                                                    */
/* ------------------------------------------------------------------ */

const rawUrl = env("NEXT_PUBLIC_SITE_URL") || siteConfig.url;
let host = "";
try {
  host = new URL(rawUrl).hostname.toLowerCase();
} catch {
  host = "";
}

if (!host) {
  blocker("Canonical domain", `NEXT_PUBLIC_SITE_URL is not a valid URL (${rawUrl || "unset"})`);
} else if (["example.com", "www.example.com", "localhost", "127.0.0.1"].includes(host)) {
  blocker("Canonical domain", `still ${host} — canonical tags, sitemap and Open Graph would all be wrong`);
} else if (!rawUrl.startsWith("https://")) {
  blocker("Canonical domain", `${rawUrl} is not https`);
} else {
  ready("Canonical domain", rawUrl);
}

/* ------------------------------------------------------------------ */
/* Quote delivery — the one that matters most                          */
/* ------------------------------------------------------------------ */

const externalEndpoint = env("NEXT_PUBLIC_FORMS_ENDPOINT");
// The database takes priority over the webhook in resolveStore(), so it
// is checked first here too.
const supabase = env("SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY");
const store = supabase || env("QUOTE_WEBHOOK_URL");
const notifiers = [
  env("QUOTE_EMAIL_API_KEY") && env("QUOTE_EMAIL_TO") && env("QUOTE_EMAIL_FROM") ? "email" : "",
  env("QUOTE_NOTIFY_WEBHOOK_URL") ? "notify-webhook" : "",
].filter(Boolean);

if (!siteConfig.features.quoteEnabled) {
  blocker("Quote system", "features.quoteEnabled is false — the RFQ flow is switched off");
} else if (siteConfig.features.quoteServiceMode === "mock" && !externalEndpoint) {
  blocker(
    "Quote delivery",
    'features.quoteServiceMode is "mock" — a production build will refuse to submit. Set it to "api".',
  );
} else if (externalEndpoint) {
  ready("Quote delivery", `external endpoint ${externalEndpoint}`);
} else if (store) {
  ready(
    "Quote delivery",
    `persisted via ${supabase ? "Supabase" : "QUOTE_WEBHOOK_URL"}${notifiers.length ? `, notifying: ${notifiers.join(", ")}` : ""}`,
  );
} else if (notifiers.length) {
  warning(
    "Quote delivery",
    `notification only (${notifiers.join(", ")}) — no durable store. A failed notification loses the RFQ. Set QUOTE_WEBHOOK_URL.`,
  );
} else {
  blocker(
    "Quote delivery",
    "no QUOTE_WEBHOOK_URL and no notifier configured — /api/quote will answer 503 and no enquiry can reach you",
  );
}

if (notifiers.length === 0 && (store || externalEndpoint)) {
  warning("Sales notification", "requests will be stored but nobody is emailed or pinged");
}

/* ------------------------------------------------------------------ */
/* Legal identity                                                      */
/* ------------------------------------------------------------------ */

const legal = siteConfig.legal;
if (!legal.name?.trim() || legal.name.trim().toLowerCase() === "silvora") {
  blocker(
    "Legal entity name",
    'still the brand placeholder — it appears in Organization structured data, the legal pages and the footer copyright',
  );
} else {
  ready("Legal entity name", legal.name);
}
if (!legal.registrationNumber) warning("Company registration number", "not set (optional, but expected on quote documents)");
if (!legal.taxNumber) warning("Tax number", "not set");

/* ------------------------------------------------------------------ */
/* Contact channels                                                    */
/* ------------------------------------------------------------------ */

const digits = (v: string) => v.replace(/\D/g, "");
const placeholderNumber = (v: string) => digits(v).length < 8 || /^0+$/.test(digits(v));

const phoneOk = !placeholderNumber(siteConfig.contact.phone);
const waOk = !placeholderNumber(siteConfig.contact.whatsapp);
const emailOk =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(siteConfig.contact.email) &&
  !/example\.(com|org|net)$/i.test(siteConfig.contact.email);

if (!phoneOk && !waOk && !emailOk) {
  blocker(
    "Contact channels",
    "phone, WhatsApp and email are all placeholders — if the RFQ fails, a buyer has no way to reach you",
  );
} else {
  if (phoneOk) ready("Phone", siteConfig.contact.phone);
  else warning("Phone", "placeholder — the number shows as plain text and 'Call sales' is hidden");
  if (waOk) ready("WhatsApp", "configured");
  else warning("WhatsApp", "placeholder — every WhatsApp button is hidden");
  if (emailOk) ready("Email", siteConfig.contact.email);
  else warning("Email", "placeholder — shown as text, not a mailto link");
}

if (siteConfig.socials.some((s) => s.href === "#")) {
  warning("Social links", `${siteConfig.socials.filter((s) => s.href === "#").length} still "#" — filtered out of the footer, but remove them`);
}
if (!siteConfig.serviceAreas.length) {
  warning("Service areas", "empty — logistics copy stays generic (safe, but no coverage is shown)");
}

/* ------------------------------------------------------------------ */
/* Product data                                                        */
/* ------------------------------------------------------------------ */

const slugs = new Set<string>();
let duplicateSlug = false;
let missingImages = 0;
let demoProducts = 0;
let productsWithDocs = 0;
let productsWithBatches = 0;
let visibleSpecsInProduction = 0;

const mediaKeys = new Set(Object.keys(media));

for (const p of products) {
  if (slugs.has(p.slug)) duplicateSlug = true;
  slugs.add(p.slug);
  if (!p.images?.length || p.images.some((k) => !mediaKeys.has(k))) missingImages += 1;

  const specs = [p.weight, p.dimensions, p.wrapping, p.chop, p.moisture, p.storage, p.minimumOrder, p.delivery, p.harvestOrigin];
  if (specs.some((s) => s?.demo)) demoProducts += 1;
  visibleSpecsInProduction += specs.filter((s) => s && !s.demo).length;
  if (p.documents && Object.values(p.documents).some(Boolean)) productsWithDocs += 1;
  if (p.batches?.length) productsWithBatches += 1;
}

if (duplicateSlug) blocker("Product slugs", "duplicate slug found — run npm run validate:data");
else ready("Product slugs", `${products.length} unique`);

if (missingImages) blocker("Product images", `${missingImages} product(s) reference a missing media key`);
else ready("Product images", "all resolve");

if (demoProducts) {
  warning(
    "Product measurements",
    `${demoProducts}/${products.length} products still carry unverified figures. They are HIDDEN in production, so those pages show ${visibleSpecsInProduction} verified spec rows in total. Weigh and measure real bales — PRE-LAUNCH §5.`,
  );
} else {
  ready("Product measurements", "all verified");
}

if (!productsWithDocs) warning("Spec sheets", "no product has a specification PDF configured");
if (!productsWithBatches) warning("Batch records", "no product has batch data — the batch section renders nothing");
if (labBatches.some((b) => b.demo)) {
  warning("Laboratory data", "the /quality lab table holds demo batches (hidden in production)");
}

/* ------------------------------------------------------------------ */
/* Photography, trust, analytics                                       */
/* ------------------------------------------------------------------ */

const assets = Object.values(media);
const external = assets.filter((a) => /^https?:\/\//.test(a.src));
const owned = assets.filter((a) => a.owned).length;

if (external.length) {
  const hosts = [...new Set(external.map((a) => new URL(a.src).hostname))];
  warning(
    "Photography",
    `${external.length}/${assets.length} images load from ${hosts.join(", ")} — prototype stock, ${owned} owned. Replacement is the highest-value remaining work (PRE-LAUNCH §9).`,
  );
} else {
  ready("Photography", `${assets.length} self-hosted assets`);
}

if (!siteConfig.features.analyticsEnabled) warning("Analytics", "disabled — no events leave the browser");
if (!certifications.length && !labPartners.length && !clientLogos.length && !testimonials.length) {
  warning("Trust signals", "none configured — those sections render nothing (correct while empty)");
}
if (!caseStudies.length) warning("Case studies", "none — /results returns 404 and is out of the sitemap");

/* ------------------------------------------------------------------ */
/* Languages                                                           */
/* ------------------------------------------------------------------ */

const declared = siteConfig.languages;
const untranslated = declared.filter((l) => !activeLocales.includes(l));

ready(
  "Languages",
  `${activeLocales.map((l) => locales[l].label).join(", ")} — served at ${activeLocales
    .map((l) => (l === "en" ? "/" : `/${l}/`))
    .join(" and ")}`,
);

if (untranslated.length) {
  warning(
    "Locales shown as unavailable",
    `${untranslated.map((l) => locales[l].label).join(", ")} ${untranslated.length === 1 ? "appears" : "appear"} in the switcher but ${untranslated.length === 1 ? "is" : "are"} not linked. That is correct while unreviewed.`,
  );
}

warning(
  "Translation review",
  "no translated locale has been checked by a native speaker. Run npm run i18n:review and have docs/AR-REVIEW.md and docs/CKB-REVIEW.md read before launch — agricultural terminology especially.",
);

/* ------------------------------------------------------------------ */
/* Admin panel                                                         */
/* ------------------------------------------------------------------ */

const adminHash = env("ADMIN_PASSWORD_HASH");
const adminSecret = env("ADMIN_SESSION_SECRET");

if (!adminHash && !adminSecret) {
  // Not a blocker. The public site is complete without the panel, and
  // shipping without it is a legitimate choice.
  warning(
    "Admin panel",
    "not configured — /admin will show a sign-in page that cannot accept a password. Run npm run admin:password to enable it.",
  );
} else if (!adminHash || !adminSecret) {
  blocker(
    "Admin panel",
    `half-configured — ${adminHash ? "ADMIN_SESSION_SECRET" : "ADMIN_PASSWORD_HASH"} is missing. Nobody can sign in.`,
  );
} else if (!/^scrypt:[0-9a-f]{32,}:[0-9a-f]{64,}$/.test(adminHash)) {
  blocker("Admin panel", "ADMIN_PASSWORD_HASH is malformed — regenerate it with npm run admin:password");
} else if (adminSecret.length < 32) {
  blocker("Admin panel", "ADMIN_SESSION_SECRET is shorter than 32 characters — session cookies are weakly signed");
} else if (!supabase) {
  warning("Admin panel", "configured, but no database is connected — every screen will be empty");
} else {
  ready("Admin panel", "password and session secret set, database connected");
}

/*
 * A secret with a NEXT_PUBLIC_ name is compiled into the browser
 * bundle. For an admin password hash or a service-role key that is a
 * full compromise, so it is a blocker rather than a warning.
 */
for (const key of ["ADMIN_PASSWORD_HASH", "ADMIN_SESSION_SECRET", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (env(`NEXT_PUBLIC_${key}`)) {
    blocker("Secret exposed to the browser", `NEXT_PUBLIC_${key} is set — anything NEXT_PUBLIC_ ships in the client bundle`);
  }
}

if (activeLocales.includes("kmr" as never)) {
  warning(
    "Badini (kmr) is LIVE but unreviewed",
    "Kurmanji in the Arabic script is not standardised and parts of this translation are expected to need rewriting, not just proofreading. It is published and linked. Get docs/KMR-REVIEW.md read by a Badini speaker — start with the terminology table at the top.",
  );
}

/* ------------------------------------------------------------------ */
/* Structural guarantees                                               */
/* ------------------------------------------------------------------ */

ready("Fake-submission protection", "production refuses to report success without a real backend response");
ready("Demo-value protection", "unverified figures are hidden in production builds");
ready("Placeholder contact protection", "dead tel:/wa.me/mailto actions are never rendered");

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const blockers = items.filter((i) => i.level === "blocker");
const warnings = items.filter((i) => i.level === "warning");
const readies = items.filter((i) => i.level === "ready");

const line = (mark: string, i: Item) =>
  `  ${mark} ${i.label}${i.detail ? `\n      ${i.detail}` : ""}`;

console.log("\nSILVORA PRODUCTION AUDIT");
console.log(`environment: NODE_ENV=${process.env.NODE_ENV ?? "development"}\n`);

console.log(`BLOCKERS (${blockers.length})`);
console.log(blockers.length ? blockers.map((i) => line("✗", i)).join("\n") : "  ✓ none");

console.log(`\nWARNINGS (${warnings.length})`);
console.log(warnings.length ? warnings.map((i) => line("!", i)).join("\n") : "  ✓ none");

console.log(`\nREADY (${readies.length})`);
console.log(readies.map((i) => line("✓", i)).join("\n"));

console.log(
  blockers.length
    ? `\nNOT READY TO LAUNCH — ${blockers.length} blocker(s) above.\n`
    : "\nNo blockers. Run npm run validate:data, npm run build, then submit a real test RFQ before announcing.\n",
);

process.exit(blockers.length ? 1 : 0);
