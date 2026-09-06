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

const dictionaries: Record<string, Dictionary> = { en, ar };

/** Resolve a locale's content. Unknown locales fall back to English. */
export function getDictionaryFor(locale: LocaleCode): Dictionary {
  return dictionaries[locale] ?? en;
}
