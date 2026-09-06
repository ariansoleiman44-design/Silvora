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
import { products as productsEn } from "../data/products.ts";
import { faqs as faqsEn, faqCategoryLabels } from "../data/faqs.ts";
import { processSteps as processEn } from "../data/process.ts";
import { comparisonColumns, comparisonRows } from "../data/comparison.ts";
import { mainNav, footerNav, legalNav } from "../data/navigation.ts";
import { formatLabels, applicationLabels, orderTypeLabels, availabilityLabels } from "../data/product-labels.ts";
import { locales, activeLocales } from "../data/locales.ts";

import { copyAr } from "../data/ar/copy.ar.ts";
import { productsAr } from "../data/ar/products.ar.ts";
import { faqsAr } from "../data/ar/faqs.ar.ts";
import { processStepsAr } from "../data/ar/process.ar.ts";
import { comparisonAr } from "../data/ar/comparison.ar.ts";
import { navigationAr } from "../data/ar/navigation.ar.ts";
import { labelsAr } from "../data/ar/labels.ar.ts";

import { copyCkb } from "../data/ckb/copy.ckb.ts";
import { productsCkb } from "../data/ckb/products.ckb.ts";
import { faqsCkb } from "../data/ckb/faqs.ckb.ts";
import { processStepsCkb } from "../data/ckb/process.ckb.ts";
import { comparisonCkb } from "../data/ckb/comparison.ckb.ts";
import { navigationCkb } from "../data/ckb/navigation.ckb.ts";
import { labelsCkb } from "../data/ckb/labels.ckb.ts";

import { copyKmr } from "../data/kmr/copy.kmr.ts";
import { productsKmr } from "../data/kmr/products.kmr.ts";
import { faqsKmr } from "../data/kmr/faqs.kmr.ts";
import { processStepsKmr } from "../data/kmr/process.kmr.ts";
import { comparisonKmr } from "../data/kmr/comparison.kmr.ts";
import { navigationKmr } from "../data/kmr/navigation.kmr.ts";
import { labelsKmr } from "../data/kmr/labels.kmr.ts";

/** Every translated locale, with the guidance a reviewer of it needs. */
const TARGETS = [
  {
    code: "ar",
    file: "docs/AR-REVIEW.md",
    copy: copyAr, products: productsAr, faqs: faqsAr, process: processStepsAr,
    comparison: comparisonAr, nav: navigationAr, labels: labelsAr,
    notes: [
      "- **Agricultural vocabulary.** سيلاج، بالة، الفرم، الكبس، المادة الجافة —",
      "  regional Iraqi usage may differ from dictionary MSA. If a farmer in Erbil",
      "  would say it differently, that wording wins.",
      "- **Register.** The English is deliberately plain. Arabic marketing prose",
      "  tends to inflate; it should not here.",
    ],
  },
  {
    code: "ckb",
    file: "docs/CKB-REVIEW.md",
    copy: copyCkb, products: productsCkb, faqs: faqsCkb, process: processStepsCkb,
    comparison: comparisonCkb, nav: navigationCkb, labels: labelsCkb,
    notes: [
      "- **Agricultural vocabulary.** سایلێج، بالە، وردکردن، پەستان، ماددەی وشک —",
      "  check these against how the trade actually speaks in Erbil and",
      "  Sulaymaniyah, not against a dictionary.",
      "- **گەنمەشامی vs زوڕەت** for maize: both are used regionally. The site uses",
      "  گەنمەشامی throughout; if the trade says otherwise, change it everywhere.",
    ],
  },
  {
    code: "kmr",
    file: "docs/KMR-REVIEW.md",
    copy: copyKmr, products: productsKmr, faqs: faqsKmr, process: processStepsKmr,
    comparison: comparisonKmr, nav: navigationKmr, labels: labelsKmr,
    notes: [
      "- **⚠ This locale needs REWRITING in places, not just proofreading, and",
      "  it is LIVE.** Badini Kurmanji in the Arabic script is far less",
      "  standardised than Sorani: orthography varies between Duhok, Zakho and",
      "  Amedi, ezafe and case marking are written inconsistently, and there is",
      "  little published agricultural writing to follow. Treat every sentence",
      "  as a proposal, not a translation.",
      "- **Ezafe and case endings** (ـێ / ـا / ـێن) are the most likely errors.",
      "",
      "**Start with these terms.** Each is used site-wide, so correcting one",
      "here fixes it everywhere. These are the choices I am least sure of:",
      "",
      "| Used | For | Doubt |",
      "|---|---|---|",
      "| پلانگەه | farm (the business) | may be a Sorani-leaning choice; زەڤی or جوتیاری may be right |",
      "| سایلێج | silage | loanword — confirm it is what the trade says |",
      "| بالە | bale | loanword — confirm, and check the plural |",
      "| هوردکرن | chopping | vs وردکرن or another form |",
      "| پەستاندن | compaction | vs another verb |",
      "| ماددا هشک | dry matter | technical term, confirm |",
      "| دروین | harvest | vs حەسادکرن |",
      "| گەنمێ شامی | maize | regional variants exist |",
      "| تەریش | livestock | vs ئاژەل |",
      "| چێلەک | cow | confirm against Duhok usage |",
      "",
    ],
  },
];

interface Row {
  path: string;
  en: string;
  ar: string;
}

let rows: Row[] = [];
let untranslated: Row[] = [];

/** Strings that are the same in both languages on purpose. */
const INTENTIONAL = new Set(["Corn Fodder", "WhatsApp", "404", "%", "pH", "NDF", "ADF"]);

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

function collect(target: (typeof TARGETS)[number]) {
  rows = [];
  untranslated = [];
  const { copy: copyT, products: productsT, faqs: faqsT, process: processT,
          comparison: comparisonT, nav: navT, labels: labelsT } = target;

/* ---------------------------------------------------------------- copy */
walk("copy", copyEn, copyT);

/* ------------------------------------------------------------ products */
for (const p of productsEn) {
  const t = productsT[p.slug];
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
  add(`faqs[${i}].question`, f.question, faqsT[i]?.question);
  add(`faqs[${i}].answer`, f.answer, faqsT[i]?.answer);
});

/* ------------------------------------------------------------- process */
processEn.forEach((s, i) => {
  add(`process[${i}].title`, s.title, processT[i]?.title);
  add(`process[${i}].summary`, s.summary, processT[i]?.summary);
  add(`process[${i}].detail`, s.detail, processT[i]?.detail);
});

/* ---------------------------------------------------------- comparison */
comparisonColumns.forEach((c, i) => add(`comparison.columns[${i}]`, c.label, comparisonT.columns[i]?.label));
comparisonRows.forEach((r, i) => {
  add(`comparison.rows[${i}].label`, r.label, comparisonT.rows[i]?.label);
  for (const key of Object.keys(r.values)) {
    add(`comparison.rows[${i}].${key}`, r.values[key as keyof typeof r.values],
        comparisonT.rows[i]?.values[key as keyof typeof r.values]);
  }
});

/* ---------------------------------------------------------- navigation */
mainNav.forEach((n, i) => {
  add(`nav.main[${i}].label`, n.label, navT.main[i]?.label);
  add(`nav.main[${i}].hint`, n.hint, navT.main[i]?.hint);
});
footerNav.forEach((g, i) => {
  add(`nav.footer[${i}].title`, g.title, navT.footer[i]?.title);
  g.links.forEach((l, j) => add(`nav.footer[${i}].links[${j}]`, l.label, navT.footer[i]?.links[j]?.label));
});
legalNav.forEach((n, i) => add(`nav.legal[${i}]`, n.label, navT.legal[i]?.label));

/* -------------------------------------------------------------- labels */
for (const [group, en, ar] of [
  ["format", formatLabels, labelsT.format],
  ["application", applicationLabels, labelsT.application],
  ["orderType", orderTypeLabels, labelsT.orderType],
  ["availability", availabilityLabels, labelsT.availability],
  ["faqCategory", faqCategoryLabels, labelsT.faqCategory],
] as const) {
  for (const key of Object.keys(en)) {
    add(`labels.${group}.${key}`, (en as Record<string,string>)[key], (ar as Record<string,string>)[key]);
  }
}

}

/* -------------------------------------------------------------- output */
const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

console.log("\nCorn Fodder — TRANSLATION REVIEW SHEETS\n");
mkdirSync("docs", { recursive: true });

let totalUntranslated = 0;

for (const target of TARGETS) {
  collect(target);
  const meta = locales[target.code as keyof typeof locales];
  const live = activeLocales.includes(target.code as never);

  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const g = r.path.split(/[.[]/)[0]!;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(r);
  }

  const out: string[] = [
    `# Corn Fodder — ${meta.label} translation review`,
    "",
    `${rows.length} strings. Generated by \`npm run i18n:review\` — do not edit this`,
    "file; edit the locale's files under `data/` and regenerate.",
    "",
    live
      ? `**Status: live.** This locale is in \`activeLocales\` and is served at /${target.code}/.`
      : `**Status: NOT live.** This locale is absent from \`activeLocales\` in data/locales.ts, so nothing links to it. Add it there once this review is done.`,
    "",
    "## How to review",
    "",
    "Read the translation against the English. Where a correction is needed,",
    "note the `path` — it maps directly to the key in the locale's data files.",
    "",
    "Worth extra attention:",
    "",
    ...target.notes,
    "- **Numerals.** Western digits (0–9) throughout, by design.",
    "- **Corn Fodder** stays in Latin script inside the translated text.",
    "",
  ];

  if (untranslated.length) {
    totalUntranslated += untranslated.length;
    out.push(`## ⚠ Untranslated (${untranslated.length})`, "",
      "Identical to the English — either a missing translation or an",
      "intentional loanword.", "",
      "| Path | Text |", "|---|---|",
      ...untranslated.map((r) => `| \`${r.path}\` | ${esc(r.en)} |`), "");
  } else {
    out.push("## ✓ No untranslated strings", "");
  }

  for (const [group, list] of groups) {
    out.push(`## ${group} (${list.length})`, "", `| Path | English | ${meta.nativeLabel} |`, "|---|---|---|",
      ...list.map((r) => `| \`${r.path}\` | ${esc(r.en)} | ${esc(r.ar || "—")} |`), "");
  }

  writeFileSync(target.file, out.join("\n"));
  console.log(
    `  ${meta.label.padEnd(20)} ${String(rows.length).padStart(5)} strings  ` +
      `${untranslated.length} identical  ${live ? "live" : "NOT LIVE"}  → ${target.file}`,
  );
}

console.log("");
if (totalUntranslated) {
  console.log(`  ${totalUntranslated} string(s) identical to English — listed at the top of each file.\n`);
}
