/**
 * TRANSLATION REVIEW SHEET
 * --------------------------------------------------------------------
 *   npm run i18n:review     → writes docs/AR-REVIEW.md
 *
 * Walks the English and Arabic dictionaries in parallel and emits every
 * user-visible string side by side, grouped by where it appears.
 *
 * The point is to make a native review *fast*: a reviewer reads Arabic
 * against its English source in one pass, without opening the codebase
 * or guessing what a string is for. Each row carries the dot-path, so a
 * correction can be applied straight to data/ar/*.ts.
 *
 * It also fails loudly on untranslated strings — anything where the
 * Arabic is byte-identical to the English is flagged, which catches
 * both forgotten keys and accidental fallbacks.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { copy as copyEn } from "../data/copy.ts";
import { copyAr } from "../data/ar/copy.ar.ts";
import { products as productsEn } from "../data/products.ts";
import { productsAr } from "../data/ar/products.ar.ts";
import { faqs as faqsEn, faqCategoryLabels } from "../data/faqs.ts";
import { faqsAr } from "../data/ar/faqs.ar.ts";
import { processSteps as processEn } from "../data/process.ts";
import { processStepsAr } from "../data/ar/process.ar.ts";
import { comparisonColumns, comparisonRows } from "../data/comparison.ts";
import { comparisonAr } from "../data/ar/comparison.ar.ts";
import { mainNav, footerNav, legalNav } from "../data/navigation.ts";
import { navigationAr } from "../data/ar/navigation.ar.ts";
import { labelsAr } from "../data/ar/labels.ar.ts";
import { formatLabels, applicationLabels, orderTypeLabels, availabilityLabels } from "../data/products.ts";

interface Row {
  path: string;
  en: string;
  ar: string;
}

const rows: Row[] = [];
const untranslated: Row[] = [];

/** Strings that are the same in both languages on purpose. */
const INTENTIONAL = new Set(["SILVORA", "WhatsApp", "404", "%", "pH", "NDF", "ADF"]);

/**
 * Machine keys, not prose: option values, sort keys, hrefs and icon
 * names are structural and must stay identical across locales.
 * Flagging them as "untranslated" would bury the real misses.
 */
const MACHINE_PATH = /\.(key|value|href|icon|slug|productSlug|id)$/;

function add(path: string, en: unknown, ar: unknown) {
  if (typeof en !== "string" || typeof ar !== "string") return;
  const row = { path, en, ar };
  rows.push(row);
  if (
    en.trim() === ar.trim() &&
    !INTENTIONAL.has(en.trim()) &&
    !MACHINE_PATH.test(path) &&
    en.trim().length > 2
  ) {
    untranslated.push(row);
  }
}

/** Walk two objects of identical shape in parallel. */
function walk(prefix: string, en: unknown, ar: unknown) {
  if (typeof en === "string") return add(prefix, en, ar);
  if (Array.isArray(en)) {
    en.forEach((item, i) => walk(`${prefix}[${i}]`, item, (ar as unknown[])?.[i]));
    return;
  }
  if (en && typeof en === "object") {
    for (const key of Object.keys(en as object)) {
      walk(prefix ? `${prefix}.${key}` : key, (en as Record<string, unknown>)[key],
           (ar as Record<string, unknown>)?.[key]);
    }
  }
}

/* ---------------------------------------------------------------- copy */
walk("copy", copyEn, copyAr);

/* ------------------------------------------------------------ products */
for (const p of productsEn) {
  const t = productsAr[p.slug];
  const base = `products.${p.slug}`;
  add(`${base}.name`, p.name, t?.name);
  add(`${base}.shortName`, p.shortName, t?.shortName);
  add(`${base}.category`, p.category, t?.category);
  add(`${base}.badge`, p.badge, t?.badge);
  add(`${base}.tagline`, p.tagline, t?.tagline);
  add(`${base}.shortDescription`, p.shortDescription, t?.shortDescription);
  p.description.forEach((d, i) => add(`${base}.description[${i}]`, d, t?.description?.[i]));
  p.features.forEach((d, i) => add(`${base}.features[${i}]`, d, t?.features?.[i]));
  p.bestFor.forEach((d, i) => add(`${base}.bestFor[${i}]`, d, t?.bestFor?.[i]));
  p.storageGuidance.forEach((d, i) => add(`${base}.storageGuidance[${i}]`, d, t?.storageGuidance?.[i]));
  p.handling.forEach((d, i) => add(`${base}.handling[${i}]`, d, t?.handling?.[i]));
  for (const key of ["weight","dimensions","wrapping","chop","moisture","storage","minimumOrder","delivery","harvestOrigin"] as const) {
    const spec = p[key];
    if (!spec) continue;
    add(`${base}.${key}.label`, spec.label, t?.specs?.[key]?.label);
    add(`${base}.${key}.value`, spec.value, t?.specs?.[key]?.value);
  }
  (p.faq ?? []).forEach((f, i) => {
    add(`${base}.faq[${i}].question`, f.question, t?.faq?.[i]?.question);
    add(`${base}.faq[${i}].answer`, f.answer, t?.faq?.[i]?.answer);
  });
}

/* ---------------------------------------------------------------- faqs */
faqsEn.forEach((f, i) => {
  add(`faqs[${i}].question`, f.question, faqsAr[i]?.question);
  add(`faqs[${i}].answer`, f.answer, faqsAr[i]?.answer);
});

/* ------------------------------------------------------------- process */
processEn.forEach((s, i) => {
  add(`process[${i}].title`, s.title, processStepsAr[i]?.title);
  add(`process[${i}].summary`, s.summary, processStepsAr[i]?.summary);
  add(`process[${i}].detail`, s.detail, processStepsAr[i]?.detail);
});

/* ---------------------------------------------------------- comparison */
comparisonColumns.forEach((c, i) => add(`comparison.columns[${i}]`, c.label, comparisonAr.columns[i]?.label));
comparisonRows.forEach((r, i) => {
  add(`comparison.rows[${i}].label`, r.label, comparisonAr.rows[i]?.label);
  for (const key of Object.keys(r.values)) {
    add(`comparison.rows[${i}].${key}`, r.values[key as keyof typeof r.values],
        comparisonAr.rows[i]?.values[key as keyof typeof r.values]);
  }
});

/* ---------------------------------------------------------- navigation */
mainNav.forEach((n, i) => {
  add(`nav.main[${i}].label`, n.label, navigationAr.main[i]?.label);
  add(`nav.main[${i}].hint`, n.hint, navigationAr.main[i]?.hint);
});
footerNav.forEach((g, i) => {
  add(`nav.footer[${i}].title`, g.title, navigationAr.footer[i]?.title);
  g.links.forEach((l, j) => add(`nav.footer[${i}].links[${j}]`, l.label, navigationAr.footer[i]?.links[j]?.label));
});
legalNav.forEach((n, i) => add(`nav.legal[${i}]`, n.label, navigationAr.legal[i]?.label));

/* -------------------------------------------------------------- labels */
for (const [group, en, ar] of [
  ["format", formatLabels, labelsAr.format],
  ["application", applicationLabels, labelsAr.application],
  ["orderType", orderTypeLabels, labelsAr.orderType],
  ["availability", availabilityLabels, labelsAr.availability],
  ["faqCategory", faqCategoryLabels, labelsAr.faqCategory],
] as const) {
  for (const key of Object.keys(en)) {
    add(`labels.${group}.${key}`, (en as Record<string,string>)[key], (ar as Record<string,string>)[key]);
  }
}

/* -------------------------------------------------------------- output */
const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const groups = new Map<string, Row[]>();
for (const r of rows) {
  const g = r.path.split(/[.[]/)[0]!;
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g)!.push(r);
}

const out: string[] = [
  "# SILVORA — Arabic translation review",
  "",
  `${rows.length} strings. Generated by \`npm run i18n:review\` — do not edit this file;`,
  "edit `data/ar/*.ts` and regenerate.",
  "",
  "## How to review",
  "",
  "Read the Arabic against the English. Where a correction is needed, note the",
  "`path` — it maps directly to the key in `data/ar/`.",
  "",
  "Worth extra attention:",
  "",
  "- **Agricultural vocabulary.** سيلاج، بالة، الفرم، الكبس، المادة الجافة —",
  "  regional Iraqi usage may differ from dictionary MSA. If a farmer in Erbil",
  "  would say it differently, that wording wins.",
  "- **Register.** The English is deliberately plain and unshowy. Arabic",
  "  marketing prose tends to inflate; it should not here.",
  "- **Numerals.** Western digits (0–9) throughout, by design.",
  "- **SILVORA** stays in Latin script inside Arabic sentences.",
  "",
];

if (untranslated.length) {
  out.push(`## ⚠ Untranslated (${untranslated.length})`, "",
    "Arabic identical to English — either a missing translation or an",
    "intentional loanword.", "",
    "| Path | Text |", "|---|---|",
    ...untranslated.map((r) => `| \`${r.path}\` | ${esc(r.en)} |`), "");
} else {
  out.push("## ✓ No untranslated strings", "");
}

for (const [group, list] of groups) {
  out.push(`## ${group} (${list.length})`, "", "| Path | English | العربية |", "|---|---|---|",
    ...list.map((r) => `| \`${r.path}\` | ${esc(r.en)} | ${esc(r.ar || "—")} |`), "");
}

mkdirSync("docs", { recursive: true });
writeFileSync("docs/AR-REVIEW.md", out.join("\n"));

console.log(`\nSILVORA — ARABIC REVIEW SHEET\n`);
console.log(`  ${rows.length} strings written to docs/AR-REVIEW.md`);
console.log(`  ${untranslated.length} identical to English${untranslated.length ? " (listed at the top of the file)" : ""}\n`);
untranslated.slice(0, 12).forEach((r) => console.log(`    ! ${r.path}: ${r.en.slice(0, 60)}`));
if (untranslated.length > 12) console.log(`    … and ${untranslated.length - 12} more`);
console.log("");
