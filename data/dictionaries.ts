import { copy as copyEn } from "@/data/copy";
import { products as productsEn, formatLabels, applicationLabels, orderTypeLabels, availabilityLabels } from "@/data/products";
import { faqs as faqsEn, faqCategoryLabels } from "@/data/faqs";
import { processSteps as processStepsEn } from "@/data/process";
import { comparisonColumns as comparisonColumnsEn, comparisonRows as comparisonRowsEn } from "@/data/comparison";
import { mainNav as mainNavEn, footerNav as footerNavEn, legalNav as legalNavEn } from "@/data/navigation";

import { copyAr } from "@/data/ar/copy.ar";
import { productsAr } from "@/data/ar/products.ar";
import { faqsAr } from "@/data/ar/faqs.ar";
import { processStepsAr } from "@/data/ar/process.ar";
import { comparisonAr } from "@/data/ar/comparison.ar";
import { navigationAr } from "@/data/ar/navigation.ar";
import { labelsAr } from "@/data/ar/labels.ar";

import { copyCkb } from "@/data/ckb/copy.ckb";
import { productsCkb } from "@/data/ckb/products.ckb";
import { faqsCkb } from "@/data/ckb/faqs.ckb";
import { processStepsCkb } from "@/data/ckb/process.ckb";
import { comparisonCkb } from "@/data/ckb/comparison.ckb";
import { navigationCkb } from "@/data/ckb/navigation.ckb";
import { labelsCkb } from "@/data/ckb/labels.ckb";

import { copyKmr } from "@/data/kmr/copy.kmr";
import { productsKmr } from "@/data/kmr/products.kmr";
import { faqsKmr } from "@/data/kmr/faqs.kmr";
import { processStepsKmr } from "@/data/kmr/process.kmr";
import { comparisonKmr } from "@/data/kmr/comparison.kmr";
import { navigationKmr } from "@/data/kmr/navigation.kmr";
import { labelsKmr } from "@/data/kmr/labels.kmr";

import { PRODUCT_SPEC_KEYS, type ProductTranslation } from "@/types/i18n";
import type { Product, SpecItem } from "@/types/product";
import type { LocaleCode } from "@/lib/i18n";

/**
 * DICTIONARIES
 * --------------------------------------------------------------------
 * One resolved bundle of content per locale.
 *
 * English is the source of truth. Arabic is an *overlay*: it supplies
 * language only, and everything structural — slugs, ids, images, format
 * codes, measurements, `demo` flags, availability states — comes from
 * `data/products.ts`. A measured bale weight cannot differ between the
 * English and Arabic pages, because there is only one of it.
 *
 * Anything a locale has not translated falls back to English rather
 * than rendering an empty string.
 */

/* ------------------------------------------------------------------ */
/* Product merge                                                       */
/* ------------------------------------------------------------------ */

function mergeSpec(base: SpecItem | undefined, patch: Partial<SpecItem> | undefined): SpecItem | undefined {
  if (!base) return undefined;
  if (!patch) return base;
  // `demo` is never overridable by a translation: whether a figure is
  // verified is a fact about the data, not about the language.
  return { ...base, ...patch, demo: base.demo };
}

function translateProduct(product: Product, t: ProductTranslation | undefined): Product {
  if (!t) return product;

  const next: Product = {
    ...product,
    name: t.name ?? product.name,
    shortName: t.shortName ?? product.shortName,
    category: t.category ?? product.category,
    tagline: t.tagline ?? product.tagline,
    shortDescription: t.shortDescription ?? product.shortDescription,
    description: t.description ?? product.description,
    badge: t.badge ?? product.badge,
    features: t.features ?? product.features,
    bestFor: t.bestFor ?? product.bestFor,
    storageGuidance: t.storageGuidance ?? product.storageGuidance,
    handling: t.handling ?? product.handling,
    availabilityNote: t.availabilityNote ?? product.availabilityNote,
    faq: t.faq ?? product.faq,
    seo: t.seo ? { ...product.seo, ...t.seo } : product.seo,
  };

  for (const key of PRODUCT_SPEC_KEYS) {
    const merged = mergeSpec(product[key], t.specs?.[key]);
    if (merged) next[key] = merged;
  }

  if (t.nutritionLabels && product.nutrition) {
    next.nutrition = product.nutrition.map((n) => ({
      ...n,
      label: t.nutritionLabels?.[n.key] ?? n.label,
    }));
  }

  return next;
}

function translateProducts(overlay: Record<string, ProductTranslation>): Product[] {
  return productsEn.map((p) => translateProduct(p, overlay[p.slug]));
}

/* ------------------------------------------------------------------ */
/* Dictionaries                                                        */
/* ------------------------------------------------------------------ */

export interface Dictionary {
  locale: LocaleCode;
  copy: typeof copyEn;
  products: Product[];
  faqs: typeof faqsEn;
  processSteps: typeof processStepsEn;
  comparison: {
    columns: typeof comparisonColumnsEn;
    rows: typeof comparisonRowsEn;
  };
  nav: {
    main: typeof mainNavEn;
    footer: typeof footerNavEn;
    legal: typeof legalNavEn;
  };
  labels: {
    format: typeof formatLabels;
    application: typeof applicationLabels;
    orderType: typeof orderTypeLabels;
    availability: typeof availabilityLabels;
    faqCategory: typeof faqCategoryLabels;
  };
}

const en: Dictionary = {
  locale: "en",
  copy: copyEn,
  products: productsEn,
  faqs: faqsEn,
  processSteps: processStepsEn,
  comparison: { columns: comparisonColumnsEn, rows: comparisonRowsEn },
  nav: { main: mainNavEn, footer: footerNavEn, legal: legalNavEn },
  labels: {
    format: formatLabels,
    application: applicationLabels,
    orderType: orderTypeLabels,
    availability: availabilityLabels,
    faqCategory: faqCategoryLabels,
  },
};

const ar: Dictionary = {
  locale: "ar",
  copy: copyAr,
  products: translateProducts(productsAr),
  faqs: faqsAr,
  processSteps: processStepsAr,
  comparison: comparisonAr,
  nav: navigationAr,
  labels: labelsAr,
};

const ckb: Dictionary = {
  locale: "ckb",
  copy: copyCkb,
  products: translateProducts(productsCkb),
  faqs: faqsCkb,
  processSteps: processStepsCkb,
  comparison: comparisonCkb,
  nav: navigationCkb,
  labels: labelsCkb,
};

/**
 * Badini. Present so the translation can be built and reviewed, but NOT
 * in `activeLocales` — nothing links to it until a native speaker has
 * been through docs/KMR-REVIEW.md. See data/kmr/copy.kmr.ts.
 */
const kmr: Dictionary = {
  locale: "kmr",
  copy: copyKmr,
  products: translateProducts(productsKmr),
  faqs: faqsKmr,
  processSteps: processStepsKmr,
  comparison: comparisonKmr,
  nav: navigationKmr,
  labels: labelsKmr,
};

const dictionaries: Record<string, Dictionary> = { en, ar, ckb, kmr };

/** Resolve a locale's content. Unknown locales fall back to English. */
export function getDictionaryFor(locale: LocaleCode): Dictionary {
  return dictionaries[locale] ?? en;
}
