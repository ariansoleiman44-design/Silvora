/**
 * PRODUCT DATA VALIDATION
 * --------------------------------------------------------------------
 *   npm run validate:data
 *
 * Catches the configuration mistakes that TypeScript cannot: duplicate
 * slugs, images that do not exist in the registry, document URLs that
 * would render a broken button, batches without codes, dates in the
 * wrong order, unit typos.
 *
 * Runs on Node's native TypeScript support — no runner, no new
 * dependency. Requires Node 22.6+ (this repo is developed on 25.x).
 *
 * Exit code 1 on any ERROR, 0 when only warnings remain, so it can gate
 * a deploy.
 */
import { products } from "../data/products.ts";
import { formatLabels } from "../data/product-labels.ts";
import { media } from "../data/media.ts";
import { caseStudies } from "../data/case-studies.ts";
import { faqs } from "../data/faqs.ts";
import { processSteps } from "../data/process.ts";
import { productsAr } from "../data/ar/products.ar.ts";
import { faqsAr } from "../data/ar/faqs.ar.ts";
import { processStepsAr } from "../data/ar/process.ar.ts";
import { productsCkb } from "../data/ckb/products.ckb.ts";
import { faqsCkb } from "../data/ckb/faqs.ckb.ts";
import { processStepsCkb } from "../data/ckb/process.ckb.ts";
import { productsKmr } from "../data/kmr/products.kmr.ts";
import { faqsKmr } from "../data/kmr/faqs.kmr.ts";
import { processStepsKmr } from "../data/kmr/process.kmr.ts";

interface Finding {
  level: "error" | "warn";
  where: string;
  message: string;
}

const findings: Finding[] = [];
const error = (where: string, message: string) => findings.push({ level: "error", where, message });
const warn = (where: string, message: string) => findings.push({ level: "warn", where, message });

const mediaKeys = new Set(Object.keys(media));
const AVAILABILITY = ["available", "limited", "preorder", "seasonal", "contact", "unavailable"];
const WEIGHT_UNITS = ["kg", "t", "lb"];
const LENGTH_UNITS = ["cm", "m", "mm", "in"];
const LAB_STATUSES = ["available", "pending", "not-tested", "superseded"];
const BASES = ["actual-sample", "production-average", "batch-specific", "supplier-declared"];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Mirrors lib/url-safety.ts. Kept inline so this script imports no aliases. */
function documentUrlProblem(url: string | undefined | null): string | null {
  if (!url) return null;
  const value = url.trim();
  if (!value) return "empty string — remove the field instead";
  if (value === "#") return '"#" is a placeholder, not a document';
  const lower = value.toLowerCase();
  for (const scheme of ["javascript:", "data:", "vbscript:", "file:", "blob:"]) {
    if (lower.startsWith(scheme)) return `blocked scheme ${scheme}`;
  }
  if (value.startsWith("//")) return "protocol-relative URL — use https://";
  if (value.startsWith("/")) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return `unsupported scheme ${parsed.protocol}`;
    }
    return null;
  } catch {
    return "not a valid URL, and not a site-relative path starting with /";
  }
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

const slugs = new Map<string, number>();
const ids = new Map<string, number>();

products.forEach((p, index) => {
  const where = `products[${index}] ${p.slug ?? "(no slug)"}`;

  /* identity */
  if (!p.slug) error(where, "missing slug");
  else if (slugs.has(p.slug)) error(where, `duplicate slug — also products[${slugs.get(p.slug)}]`);
  else slugs.set(p.slug, index);

  if (!p.id) error(where, "missing id");
  else if (ids.has(p.id)) error(where, `duplicate id "${p.id}" — also products[${ids.get(p.id)}]`);
  else ids.set(p.id, index);

  if (p.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) {
    error(where, `slug "${p.slug}" should be lowercase words separated by hyphens`);
  }

  /* images */
  if (!p.images?.length) error(where, "no images — the card and gallery will be empty");
  p.images?.forEach((key) => {
    if (!mediaKeys.has(key)) error(where, `image "${key}" is not in data/media.ts`);
  });

  /* format + availability */
  if (!(p.format in formatLabels)) error(where, `unknown format "${p.format}"`);
  if (!AVAILABILITY.includes(p.availability)) {
    error(where, `availability "${p.availability}" is not one of ${AVAILABILITY.join(", ")}`);
  }
  if (p.availableFrom && !ISO_DATE.test(p.availableFrom)) {
    error(where, `availableFrom "${p.availableFrom}" is not yyyy-mm-dd`);
  }
  if (p.availableUntil && !ISO_DATE.test(p.availableUntil)) {
    error(where, `availableUntil "${p.availableUntil}" is not yyyy-mm-dd`);
  }
  if (
    p.availableFrom &&
    p.availableUntil &&
    ISO_DATE.test(p.availableFrom) &&
    ISO_DATE.test(p.availableUntil) &&
    p.availableFrom > p.availableUntil
  ) {
    error(where, "availableFrom is after availableUntil");
  }

  /* measurements */
  const wm = p.weightMeasurement;
  if (wm) {
    if (!WEIGHT_UNITS.includes(wm.unit)) error(where, `weight unit "${wm.unit}" is not ${WEIGHT_UNITS.join("/")}`);
    if (!BASES.includes(wm.measurementBasis)) error(where, `weight measurementBasis "${wm.measurementBasis}" is invalid`);
    if (wm.nominal === undefined && wm.minimum === undefined && wm.maximum === undefined) {
      error(where, "weightMeasurement has no nominal, minimum or maximum");
    }
    if (wm.minimum !== undefined && wm.maximum !== undefined && wm.minimum > wm.maximum) {
      error(where, "weight minimum is greater than maximum");
    }
    for (const [k, v] of Object.entries({ nominal: wm.nominal, minimum: wm.minimum, maximum: wm.maximum })) {
      if (v !== undefined && (!Number.isFinite(v) || v <= 0)) error(where, `weight ${k} must be a positive number`);
    }
    if (!wm.demo && wm.measurementBasis === "supplier-declared") {
      warn(where, "weight is marked verified but the basis is supplier-declared — has it been weighed?");
    }
  }

  const dm = p.dimensionMeasurement;
  if (dm) {
    if (!LENGTH_UNITS.includes(dm.unit)) error(where, `dimension unit "${dm.unit}" is not ${LENGTH_UNITS.join("/")}`);
    if (!BASES.includes(dm.measurementBasis)) error(where, `dimension measurementBasis "${dm.measurementBasis}" is invalid`);
    const any = [dm.diameter, dm.width, dm.length, dm.height].some((v) => v !== undefined);
    if (!any) error(where, "dimensionMeasurement has no diameter, width, length or height");
  }

  /* demo consistency */
  const specs = [p.weight, p.dimensions, p.wrapping, p.chop, p.moisture, p.storage, p.minimumOrder, p.delivery, p.harvestOrigin];
  const demoCount = specs.filter((s) => s?.demo).length;
  if (demoCount) warn(where, `${demoCount} unverified spec value(s) — hidden in production, see PRE-LAUNCH §5`);

  specs.forEach((s) => {
    if (s && !s.demo && /add in data|set your|replace|placeholder|TBD|TODO/i.test(s.value)) {
      error(where, `"${s.label}" is marked verified but reads like a placeholder: "${s.value}"`);
    }
  });

  (p.nutrition ?? []).forEach((n) => {
    if (typeof n.value === "number" && !n.demo) {
      warn(where, `nutrition "${n.label}" is on the product — lab figures belong to a batch (see §9)`);
    }
  });

  /* documents */
  const docs = p.documents;
  if (docs) {
    for (const field of ["specSheetUrl", "labReportUrl", "handlingGuideUrl", "storageGuideUrl"] as const) {
      const problem = documentUrlProblem(docs[field]);
      if (problem) error(where, `documents.${field}: ${problem}`);
    }
    (docs.certificates ?? []).forEach((c, i) => {
      const problem = documentUrlProblem(c.url);
      if (problem) error(where, `documents.certificates[${i}] (${c.label}): ${problem}`);
      if (!c.label?.trim()) error(where, `documents.certificates[${i}] has no label`);
    });
  }

  /* batches */
  const codes = new Set<string>();
  (p.batches ?? []).forEach((b, i) => {
    const bw = `${where} batch[${i}]`;
    if (!b.code?.trim()) error(bw, "batch has no code");
    else if (codes.has(b.code)) error(bw, `duplicate batch code "${b.code}"`);
    else codes.add(b.code);

    for (const field of ["harvestDate", "packingDate", "labDate"] as const) {
      if (b[field] && !ISO_DATE.test(b[field]!)) error(bw, `${field} "${b[field]}" is not yyyy-mm-dd`);
    }
    if (b.harvestDate && b.packingDate && b.harvestDate > b.packingDate) {
      error(bw, "harvestDate is after packingDate");
    }
    if (b.packingDate && b.labDate && b.labDate < b.packingDate) {
      warn(bw, "labDate is before packingDate — check the record");
    }
    if (b.labStatus && !LAB_STATUSES.includes(b.labStatus)) {
      error(bw, `labStatus "${b.labStatus}" is not one of ${LAB_STATUSES.join(", ")}`);
    }
    const problem = documentUrlProblem(b.labReportUrl);
    if (problem) error(bw, `labReportUrl: ${problem}`);
    if (b.labReportUrl && b.labStatus && b.labStatus !== "available" && b.labStatus !== "superseded") {
      warn(bw, `has a lab report but labStatus is "${b.labStatus}"`);
    }
    if (b.nutrition) {
      for (const [key, metric] of Object.entries(b.nutrition)) {
        if (!metric) continue;
        if (!Number.isFinite(metric.value)) error(bw, `nutrition.${key} has a non-numeric value`);
        if (metric.range && metric.range.min > metric.range.max) {
          error(bw, `nutrition.${key} range min is greater than max`);
        }
      }
    }
  });

  if (p.documents?.labReportUrl && !(p.batches ?? []).length) {
    warn(where, "a lab report is configured but there are no batch records to attach it to");
  }
});

/* ------------------------------------------------------------------ */
/* Other data                                                          */
/* ------------------------------------------------------------------ */

const caseSlugs = new Set<string>();
caseStudies.forEach((c, i) => {
  const where = `caseStudies[${i}] ${c.slug}`;
  if (!c.slug) error(where, "missing slug");
  else if (caseSlugs.has(c.slug)) error(where, "duplicate slug");
  else caseSlugs.add(c.slug);
  if (c.image && !mediaKeys.has(c.image)) error(where, `image "${c.image}" is not in data/media.ts`);
  if (!c.approved) warn(where, "not approved — it will not be published");
  c.productsUsed.forEach((slug) => {
    if (!slugs.has(slug)) error(where, `productsUsed references unknown product "${slug}"`);
  });
});

const questions = new Set<string>();
faqs.forEach((f, i) => {
  if (questions.has(f.question)) warn(`faqs[${i}]`, "duplicate question");
  questions.add(f.question);
  if (!f.answer?.trim()) error(`faqs[${i}]`, "empty answer");
});

/* ------------------------------------------------------------------ */
/* Translations                                                        */
/* ------------------------------------------------------------------ */

// UI copy is type-checked against `Copy`, so a missing key is already a
// compile error. What TypeScript cannot check is the product overlay
// (keyed by slug) and the parallel arrays, which must line up exactly.

const TRANSLATIONS = [
  { code: "ar", dir: "ar", products: productsAr, faqs: faqsAr, process: processStepsAr },
  { code: "ckb", dir: "ckb", products: productsCkb, faqs: faqsCkb, process: processStepsCkb },
  { code: "kmr", dir: "kmr", products: productsKmr, faqs: faqsKmr, process: processStepsKmr },
];

for (const t of TRANSLATIONS) {
  const where = `${t.dir}/products.${t.code}.ts`;

  for (const p of products) {
    if (!t.products[p.slug]) {
      error(where, `no ${t.code} translation for product "${p.slug}"`);
    }
  }
  for (const slug of Object.keys(t.products)) {
    if (!slugs.has(slug)) {
      error(where, `translation for unknown product "${slug}" — a renamed or deleted slug?`);
    }
  }

  const faqWhere = `${t.dir}/faqs.${t.code}.ts`;
  if (t.faqs.length !== faqs.length) {
    error(faqWhere, `${t.faqs.length} ${t.code} FAQs vs ${faqs.length} English — the arrays must match one-for-one`);
  }
  t.faqs.forEach((f, i) => {
    if (faqs[i] && f.category !== faqs[i]!.category) {
      error(faqWhere, `faq[${i}] category "${f.category}" does not match English "${faqs[i]!.category}"`);
    }
  });

  const stepWhere = `${t.dir}/process.${t.code}.ts`;
  if (t.process.length !== processSteps.length) {
    error(stepWhere, `${t.process.length} ${t.code} steps vs ${processSteps.length} English`);
  }
  t.process.forEach((step, i) => {
    if (processSteps[i] && step.index !== processSteps[i]!.index) {
      error(stepWhere, `step[${i}] index ${step.index} does not match English ${processSteps[i]!.index}`);
    }
    if (processSteps[i] && step.image !== processSteps[i]!.image) {
      error(stepWhere, `step[${i}] image "${step.image}" does not match English "${processSteps[i]!.image}"`);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const errors = findings.filter((f) => f.level === "error");
const warnings = findings.filter((f) => f.level === "warn");

console.log("\nCorn Fodder — PRODUCT DATA VALIDATION\n");
console.log(`  ${products.length} products · ${mediaKeys.size} media keys · ${faqs.length} FAQs · ${caseStudies.length} case studies`);
console.log(`  translations: ${TRANSLATIONS.map((t) => t.code).join(', ')}\n`);

if (errors.length) {
  console.log(`ERRORS (${errors.length})`);
  for (const f of errors) console.log(`  ✗ ${f.where}: ${f.message}`);
  console.log("");
}

if (warnings.length) {
  console.log(`WARNINGS (${warnings.length})`);
  for (const f of warnings) console.log(`  ! ${f.where}: ${f.message}`);
  console.log("");
}

if (!errors.length && !warnings.length) console.log("  ✓ No problems found.\n");
else if (!errors.length) console.log("  ✓ No errors. Warnings above do not block a deploy.\n");

process.exit(errors.length ? 1 : 0);
