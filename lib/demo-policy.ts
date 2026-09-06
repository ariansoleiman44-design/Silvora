import { siteConfig } from "@/data/site-config";
import type { Product, SpecItem } from "@/types/product";

/**
 * DEMO DATA POLICY
 * --------------------------------------------------------------------
 * Any product figure that has not been measured carries `demo: true`.
 *
 * THE RULE: a production build never shows one.
 *
 * Policy (A) from the launch spec — hide, do not label. A visible
 * "indicative" tag still puts a number in front of a buyer who is
 * planning trailer loads and storage around it, and tags get missed. A
 * missing row cannot be misread; a wrong weight can.
 *
 * This is forced regardless of `features.showDemoValues`, which only
 * controls whether placeholders are visible while developing. It is the
 * same shape of guarantee as the quote service refusing to fake a
 * submission: safe by default, and impossible to switch off by
 * configuration alone.
 *
 * Consequence: until real measurements are entered, production product
 * pages show fewer rows. That is the correct outcome, and
 * `npm run launch:audit` reports it.
 */

/** True when unverified values may be rendered. Always false in production. */
export function showDemoValues(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return siteConfig.features.showDemoValues;
}

/** Drop a spec entirely when it is unverified and we are in production. */
export function visibleSpec(spec?: SpecItem): SpecItem | undefined {
  if (!spec) return undefined;
  if (spec.demo && !showDemoValues()) return undefined;
  return spec;
}

/** Filter a list of specs through the same rule. */
export function visibleSpecs(specs: (SpecItem | undefined)[]): SpecItem[] {
  return specs.filter((s): s is SpecItem => Boolean(visibleSpec(s)));
}

/** Generic: keep records unless they are demo and demo is hidden. */
export function withoutDemo<T extends { demo?: boolean }>(items: T[]): T[] {
  if (showDemoValues()) return items;
  return items.filter((i) => !i.demo);
}

/**
 * True when a product still carries unverified figures. Used by the
 * launch audit, not by the UI.
 */
export function hasDemoValues(specs: (SpecItem | undefined)[]): boolean {
  return specs.some((s) => s?.demo);
}

/**
 * Strip unverified data from a product before it crosses into a client
 * component.
 *
 * Without this the values are not *displayed* in production, but they
 * are still serialised into the RSC payload embedded in the HTML, where
 * "≈ 700 – 800 kg" is one View Source away from looking like a
 * specification.
 *
 * LIMIT OF THIS DEFENCE: `data/products.ts` is also imported directly by
 * client components (the catalogue filter, the homepage signature bale,
 * search), so the full catalogue — demo values included — is present in
 * the JavaScript bundle regardless. This removes them from the HTML
 * source, not from the bundle. The only complete fix is replacing them
 * with measured values; see PRE-LAUNCH.md §5.
 */
export function sanitizeProduct<T extends Product>(product: T): T {
  if (showDemoValues()) return product;

  const clean = { ...product };
  const specKeys = [
    "weight",
    "dimensions",
    "wrapping",
    "chop",
    "moisture",
    "storage",
    "minimumOrder",
    "delivery",
    "harvestOrigin",
  ] as const;

  for (const key of specKeys) {
    if (clean[key]?.demo) delete clean[key];
  }
  if (clean.weightMeasurement?.demo) delete clean.weightMeasurement;
  if (clean.dimensionMeasurement?.demo) delete clean.dimensionMeasurement;
  if (clean.nutrition) clean.nutrition = withoutDemo(clean.nutrition);
  if (clean.batches) clean.batches = withoutDemo(clean.batches);

  return clean;
}
