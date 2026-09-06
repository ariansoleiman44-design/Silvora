import type { MediaKey } from "@/data/media";

/** Physical bale format. `custom` is used for bulk / made-to-order listings. */
export type BaleFormat = "round" | "square" | "compact" | "custom";

/** Who the bale is primarily intended for. A product may serve several. */
export type Application = "dairy" | "beef" | "sheep-goats" | "general";

/** The kind of buyer / order size the product is positioned for. */
export type OrderType = "small-farm" | "commercial" | "bulk" | "export";

/**
 * Availability is a *state of supply*, never a stock count. There are no
 * unit counts anywhere in this system and none should ever be added —
 * "only 3 left" is not something this business can honestly say.
 */
export type Availability =
  | "available"
  | "limited"
  | "preorder"
  | "seasonal"
  | "contact"
  | "unavailable";

/**
 * A single labelled value shown in the specification table.
 * Every spec in the demo catalogue is marked `demo: true` until it is
 * replaced with real measured / laboratory data.
 */
export interface SpecItem {
  label: string;
  value: string;
  note?: string;
  demo?: boolean;
}

export interface NutritionValue {
  /** Machine key — see data/lab-data.ts for the canonical parameter list. */
  key: string;
  label: string;
  unit: string;
  /** Leave undefined to render "Lab data available per batch". */
  value?: number;
  demo?: boolean;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

/**
 * State of the laboratory analysis for a batch.
 *   available   — a report exists and (usually) a PDF is configured
 *   pending     — samples sent, results not back
 *   not-tested  — no analysis for this batch
 *   superseded  — a later report replaces this one
 */
export type LabStatus = "available" | "pending" | "not-tested" | "superseded";

/**
 * MEASUREMENTS
 * --------------------------------------------------------------------
 * Weight and dimensions are OPERATIONAL DATA. A buyer plans handling
 * equipment, trailer loads and storage around them.
 *
 * They must come from weighing and measuring real bales — never from a
 * baler manufacturer's brochure, never from a comparable product, and
 * never generated. `measurementBasis` records where the figure came
 * from so nobody has to guess later.
 */
export type MeasurementBasis =
  /** Weighed / measured from actual sampled bales. */
  | "actual-sample"
  /** Averaged across a production run. */
  | "production-average"
  /** Specific to one batch. */
  | "batch-specific"
  /** Stated by a supplier or equipment maker, not verified by us. */
  | "supplier-declared";

export type WeightUnit = "kg" | "t" | "lb";
export type LengthUnit = "cm" | "m" | "mm" | "in";

export interface WeightMeasurement {
  /** Typical value. Omit if only a range is known. */
  nominal?: number;
  minimum?: number;
  maximum?: number;
  unit: WeightUnit;
  /** e.g. "±5% with moisture". Shown next to the figure. */
  tolerance?: string;
  measurementBasis: MeasurementBasis;
  /** ISO date the measurement was taken. */
  measuredAt?: string;
  /** True until the figure is verified. Hidden in production. */
  demo?: boolean;
}

export interface DimensionMeasurement {
  /** Round bales. */
  diameter?: number;
  /** Round bale width, or square bale width. */
  width?: number;
  length?: number;
  height?: number;
  unit: LengthUnit;
  tolerance?: string;
  measurementBasis: MeasurementBasis;
  measuredAt?: string;
  demo?: boolean;
}

/**
 * A single laboratory metric.
 *
 * `value` is only ever a real measured number. There is no default and
 * no fallback: a metric with no value is simply absent from the record,
 * and the UI shows "analysis available per batch" instead.
 */
export interface LabMetric {
  value: number;
  /** e.g. "%", "% DM", "MJ/kg DM". Empty string for pH. */
  unit: string;
  /** Analysis method, e.g. "NIR", "wet chemistry". */
  method?: string;
  /** Range reported by the laboratory, when given. */
  range?: { min: number; max: number };
  /** Where the number came from, e.g. the laboratory's name. */
  source?: string;
}

/**
 * Nutrition belongs to a BATCH, never to a product.
 *
 * A laboratory measures what was in the bale it received. Publishing one
 * "product nutrition profile" would claim every bale of that format is
 * identical, which is false for a fermented crop. Keep it here.
 */
export interface BatchNutrition {
  dryMatter?: LabMetric;
  moisture?: LabMetric;
  crudeProtein?: LabMetric;
  starch?: LabMetric;
  ndf?: LabMetric;
  adf?: LabMetric;
  ph?: LabMetric;
  ash?: LabMetric;
  sugar?: LabMetric;
  /** Metabolisable energy, if the laboratory reports it. */
  energy?: LabMetric;
}

/**
 * One harvest batch. Every field is optional except the code, and the UI
 * renders only the fields that are present — an empty batch shows
 * nothing rather than a grid of dashes. A product may carry several.
 */
export interface ProductBatch {
  code: string;
  harvestSeason?: string;
  origin?: string;
  /** Internal field / plot identifier. Not usually shown publicly. */
  fieldReference?: string;
  cropVariety?: string;
  /** ISO date (yyyy-mm-dd). */
  harvestDate?: string;
  /** ISO date (yyyy-mm-dd). */
  packingDate?: string;
  /** ISO date the analysis was performed. */
  labDate?: string;
  /** Laboratory that performed the analysis. */
  labProvider?: string;
  /** PDF of the analysis. A button appears only when this is set. */
  labReportUrl?: string;
  labStatus?: LabStatus;
  /** Measured figures for THIS batch only. */
  nutrition?: BatchNutrition;
  /** Marks the record as illustrative until real batch data exists. */
  demo?: boolean;
}

/**
 * Downloadable documents. A button appears only when the corresponding
 * URL is set, so there are never broken downloads. See lib/spec-sheet.ts.
 */
export interface ProductDocument {
  label: string;
  url: string;
  /** Shown as a hint, e.g. "PDF · 420 KB". Omit if unknown. */
  fileType?: string;
  /** Size in bytes. Rendered only when set — never estimated. */
  fileSize?: number;
}

export interface ProductDocuments {
  /** PDF product specification sheet. */
  specSheetUrl?: string;
  /** PDF laboratory / batch analysis for the current batch. */
  labReportUrl?: string;
  handlingGuideUrl?: string;
  storageGuideUrl?: string;
  certificates?: ProductDocument[];
  /** Optional size/type hints keyed by the field name above. */
  meta?: Partial<Record<"specSheetUrl" | "labReportUrl" | "handlingGuideUrl" | "storageGuideUrl", { fileType?: string; fileSize?: number }>>;
}

/** Optional commercial metadata used by the procurement flow. */
export interface ProductCommercial {
  /** e.g. "Full truck loads preferred". Free text, shown as-is. */
  supplyNote?: string;
  /** Order tracks this product is suited to, if narrower than orderType. */
  suitedTo?: OrderType[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  /** Marketing family, e.g. "Round Bales". */
  category: string;
  format: BaleFormat;
  application: Application[];
  orderType: OrderType[];
  /** One-line positioning statement shown under the name. */
  tagline: string;
  shortDescription: string;
  description: string[];
  /** Keys into data/media.ts — first image is the primary. */
  images: MediaKey[];
  featured?: boolean;
  /** Tiny label such as "Signature" or "New". Keep it honest. */
  badge?: string;
  /** Used for sorting by bale size. Demo figure until confirmed. */
  approxWeightKg?: number;
  /** Human-readable spec row. Kept for display and for the spec drawer. */
  weight?: SpecItem;
  dimensions?: SpecItem;
  /**
   * Structured measurements. Richer than what is shown — the data model
   * is allowed to be more precise than the UI. When present these are
   * the authoritative figures; the SpecItems above are the display copy.
   */
  weightMeasurement?: WeightMeasurement;
  dimensionMeasurement?: DimensionMeasurement;
  wrapping?: SpecItem;
  chop?: SpecItem;
  moisture?: SpecItem;
  storage?: SpecItem;
  minimumOrder?: SpecItem;
  availability: Availability;
  /** Optional supply note shown next to the availability state. */
  availabilityNote?: string;
  /** ISO date supply opens. */
  availableFrom?: string;
  /** ISO date supply closes. */
  availableUntil?: string;
  /** e.g. "2026 first cut". */
  harvestSeason?: string;
  delivery?: SpecItem;
  harvestOrigin?: SpecItem;
  nutrition?: NutritionValue[];
  documents?: ProductDocuments;
  batches?: ProductBatch[];
  commercial?: ProductCommercial;
  /** Extra terms matched by the product search, e.g. "maize", "wrapped". */
  keywords?: string[];
  features: string[];
  bestFor: string[];
  storageGuidance: string[];
  handling: string[];
  deliveryNotes: string[];
  faq?: ProductFaq[];
  /** Slugs of related products. Falls back to same-format products. */
  related?: string[];
  seo?: {
    title?: string;
    description?: string;
  };
}
