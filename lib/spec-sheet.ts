import type { Product, ProductBatch, SpecItem } from "@/types/product";
import { applicationLabels, formatLabels, orderTypeLabels } from "@/data/product-labels";
import { siteConfig } from "@/data/site-config";
import { showDemoValues, visibleSpec, withoutDemo } from "@/lib/demo-policy";
import { isSafeDocumentUrl } from "@/lib/url-safety";

/**
 * SPECIFICATION MODEL
 * --------------------------------------------------------------------
 * Turns a `Product` into the structured sections the specification
 * drawer renders, so no component has to know which field is called
 * what. Empty values are dropped here rather than rendered as blanks.
 *
 * Also owns document availability: a download button must only ever
 * appear when a real file is configured — there are no broken links and
 * no invented certificates.
 */

export interface SpecRow {
  label: string;
  value: string;
  note?: string;
  demo?: boolean;
}

export interface SpecSection {
  key: string;
  title: string;
  /** Rendered as a definition list. */
  rows?: SpecRow[];
  /** Rendered as a bulleted list. */
  bullets?: string[];
}

/**
 * A spec row, or null. Unverified figures are dropped entirely in
 * production — see lib/demo-policy.ts.
 */
const row = (input?: SpecItem): SpecRow | null => {
  const spec = visibleSpec(input);
  return spec && spec.value
    ? { label: spec.label, value: spec.value, note: spec.note, demo: spec.demo }
    : null;
};

const compact = <T,>(list: (T | null | undefined)[]): T[] =>
  list.filter((v): v is T => Boolean(v));

/** Every specification section with content, in reading order. */
export function buildSpecSections(product: Product): SpecSection[] {
  const sections: SpecSection[] = [];

  const identity = compact<SpecRow>([
    { label: "Bale format", value: formatLabels[product.format] },
    row(product.weight),
    row(product.dimensions),
    row(product.wrapping),
    row(product.chop),
    row(product.moisture),
  ]);
  if (identity.length) sections.push({ key: "bale", title: "The bale", rows: identity });

  if (product.bestFor.length) {
    sections.push({ key: "best-for", title: "Best suited for", bullets: product.bestFor });
  }

  const storageRows = compact<SpecRow>([row(product.storage)]);
  if (storageRows.length || product.storageGuidance.length) {
    sections.push({
      key: "storage",
      title: "Storage",
      rows: storageRows.length ? storageRows : undefined,
      bullets: product.storageGuidance.length ? product.storageGuidance : undefined,
    });
  }

  if (product.handling.length) {
    sections.push({ key: "handling", title: "Handling", bullets: product.handling });
  }

  const order = compact<SpecRow>([
    row(product.minimumOrder),
    {
      label: "Application",
      value: product.application.map((a) => applicationLabels[a]).join(", "),
    },
    { label: "Order types", value: product.orderType.map((o) => orderTypeLabels[o]).join(", ") },
    product.commercial?.supplyNote
      ? { label: "Supply", value: product.commercial.supplyNote }
      : null,
  ]);
  if (order.length) sections.push({ key: "order", title: "Order requirements", rows: order });

  const delivery = compact<SpecRow>([row(product.delivery), row(product.harvestOrigin)]);
  if (delivery.length) sections.push({ key: "delivery", title: "Delivery & origin", rows: delivery });

  // Nutrition belongs to a batch, so anything sitting on the product is
  // treated with extra suspicion: unverified figures never render.
  const nutrition = withoutDemo(product.nutrition ?? [])
    .filter((n) => typeof n.value === "number")
    .map<SpecRow>((n) => ({
      label: n.label,
      value: `${n.value}${n.unit ? ` ${n.unit}` : ""}`,
      demo: n.demo,
    }));
  if (nutrition.length) {
    sections.push({ key: "nutrition", title: "Nutrition", rows: nutrition });
  }

  return sections;
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export interface ProductDownload {
  key: string;
  label: string;
  href: string;
  /** e.g. "PDF · 420 KB". Only present when genuinely known. */
  hint?: string;
  /** True for http(s) links that leave the site. */
  external: boolean;
}

const enabled = () => siteConfig.features.specSheetsEnabled;

/** "PDF · 420 KB" — omits anything that was not configured. */
function documentHint(meta?: { fileType?: string; fileSize?: number }): string | undefined {
  if (!meta) return undefined;
  const bits: string[] = [];
  if (meta.fileType) bits.push(meta.fileType.toUpperCase());
  if (typeof meta.fileSize === "number" && meta.fileSize > 0) {
    const kb = meta.fileSize / 1024;
    bits.push(kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`);
  }
  return bits.length ? bits.join(" · ") : undefined;
}

const isExternal = (href: string) => /^https?:\/\//i.test(href);

export function hasSpecSheet(product: Product): boolean {
  return enabled() && isSafeDocumentUrl(product.documents?.specSheetUrl);
}

export function hasLabReport(product: Product): boolean {
  return enabled() && isSafeDocumentUrl(product.documents?.labReportUrl);
}

/**
 * All configured downloads. Empty when nothing is set, so nothing
 * renders. Every URL is checked first: an empty string, "#",
 * `javascript:` or a malformed value is dropped rather than published
 * as a broken button.
 */
export function productDownloads(product: Product): ProductDownload[] {
  if (!enabled()) return [];
  const docs = product.documents;
  if (!docs) return [];

  const entry = (
    key: string,
    label: string,
    href: string | undefined,
    metaKey?: keyof NonNullable<typeof docs.meta>,
  ): ProductDownload | null => {
    if (!isSafeDocumentUrl(href)) return null;
    return {
      key,
      label,
      href: href!,
      hint: documentHint(metaKey ? docs.meta?.[metaKey] : undefined),
      external: isExternal(href!),
    };
  };

  return compact<ProductDownload>([
    entry("spec", "Specification sheet", docs.specSheetUrl, "specSheetUrl"),
    entry("lab", "Laboratory report", docs.labReportUrl, "labReportUrl"),
    entry("handling", "Handling guide", docs.handlingGuideUrl, "handlingGuideUrl"),
    entry("storage", "Storage guide", docs.storageGuideUrl, "storageGuideUrl"),
    ...(docs.certificates ?? []).map<ProductDownload | null>((c, i) =>
      isSafeDocumentUrl(c.url)
        ? {
            key: `cert-${i}`,
            label: c.label,
            href: c.url,
            hint: documentHint({ fileType: c.fileType, fileSize: c.fileSize }),
            external: isExternal(c.url),
          }
        : null,
    ),
  ]);
}

/* ------------------------------------------------------------------ */
/* Batches                                                             */
/* ------------------------------------------------------------------ */

/** Batch fields that are actually populated, as label/value pairs. */
export function batchRows(batch: ProductBatch): SpecRow[] {
  const labStatusLabels: Record<NonNullable<ProductBatch["labStatus"]>, string> = {
    available: "Analysis available",
    pending: "Analysis pending",
    "not-tested": "Not tested",
    superseded: "Superseded by a later analysis",
  };
  return compact<SpecRow>([
    batch.harvestSeason ? { label: "Harvest season", value: batch.harvestSeason } : null,
    batch.cropVariety ? { label: "Crop variety", value: batch.cropVariety } : null,
    batch.origin ? { label: "Origin", value: batch.origin } : null,
    batch.harvestDate ? { label: "Harvest date", value: batch.harvestDate } : null,
    batch.packingDate ? { label: "Packing date", value: batch.packingDate } : null,
    batch.labStatus ? { label: "Laboratory", value: labStatusLabels[batch.labStatus] } : null,
  ]);
}

/**
 * Batches with at least one populated field. Demo records are dropped in
 * production along with every other unverified figure, and the whole
 * feature can be switched off with `features.batchDataEnabled`.
 */
export function visibleBatches(product: Product): ProductBatch[] {
  if (!siteConfig.features.batchDataEnabled) return [];
  return withoutDemo(product.batches ?? []).filter((b) => batchRows(b).length > 0);
}

/** A batch's laboratory PDF, when one is configured and safe. */
export function batchLabReport(batch: ProductBatch): string | null {
  return isSafeDocumentUrl(batch.labReportUrl) ? batch.labReportUrl! : null;
}

/** Measured nutrition for a batch, as display rows. Empty when untested. */
export function batchNutritionRows(batch: ProductBatch): SpecRow[] {
  const n = batch.nutrition;
  if (!n) return [];
  const labels: Record<string, string> = {
    dryMatter: "Dry matter",
    moisture: "Moisture",
    crudeProtein: "Crude protein",
    starch: "Starch",
    ndf: "NDF",
    adf: "ADF",
    ph: "pH",
    ash: "Ash",
    sugar: "Sugar",
    energy: "Energy",
  };
  return Object.entries(n)
    .filter(([, metric]) => metric && typeof metric.value === "number")
    .map(([key, metric]) => ({
      label: labels[key] ?? key,
      value: `${metric!.value}${metric!.unit ? ` ${metric!.unit}` : ""}`,
      note: metric!.method,
    }));
}

/** True while unverified figures are being shown (development only). */
export const demoValuesVisible = showDemoValues;
