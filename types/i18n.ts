import type { Application, BaleFormat, OrderType, Availability, Product, SpecItem } from "@/types/product";
import type { Faq } from "@/data/faqs";
import type { ProcessStep } from "@/data/process";

/**
 * TRANSLATION SHAPES
 * --------------------------------------------------------------------
 * Only *language* is translated. Structure — slugs, ids, images, format
 * codes, measurements, demo flags, availability states — stays in
 * `data/products.ts` as the single source of truth.
 *
 * That is why products are translated with an overlay keyed by slug
 * rather than a duplicated catalogue: a measured bale weight must never
 * be able to differ between the English and Arabic pages.
 */

/** The prose of one product. Every field optional — missing falls back. */
export interface ProductTranslation {
  name?: string;
  shortName?: string;
  category?: string;
  tagline?: string;
  shortDescription?: string;
  description?: string[];
  badge?: string;
  features?: string[];
  bestFor?: string[];
  storageGuidance?: string[];
  handling?: string[];
  availabilityNote?: string;
  faq?: { question: string; answer: string }[];
  seo?: { title?: string; description?: string };
  /**
   * Specification rows. Labels always need translating; values need it
   * only where they are prose rather than a number and a unit.
   */
  specs?: Partial<Record<ProductSpecKey, Partial<SpecItem>>>;
  /** Nutrition parameter labels, keyed by the machine key. */
  nutritionLabels?: Record<string, string>;
}

export type ProductSpecKey =
  | "weight"
  | "dimensions"
  | "wrapping"
  | "chop"
  | "moisture"
  | "storage"
  | "minimumOrder"
  | "delivery"
  | "harvestOrigin";

export const PRODUCT_SPEC_KEYS: ProductSpecKey[] = [
  "weight",
  "dimensions",
  "wrapping",
  "chop",
  "moisture",
  "storage",
  "minimumOrder",
  "delivery",
  "harvestOrigin",
];

/** Everything a locale needs, resolved once per request. */
export interface LocaleContent {
  products: Product[];
  faqs: Faq[];
  processSteps: ProcessStep[];
  labels: {
    format: Record<BaleFormat, string>;
    application: Record<Application, string>;
    orderType: Record<OrderType, string>;
    availability: Record<Availability, string>;
  };
  nav: {
    main: { label: string; href: string; hint?: string }[];
    footer: { title: string; links: { label: string; href: string }[] }[];
    legal: { label: string; href: string }[];
  };
  comparison: {
    columns: { key: string; label: string; productSlug: string }[];
    rows: { label: string; values: Record<string, string> }[];
  };
  about: Record<string, unknown>;
}
