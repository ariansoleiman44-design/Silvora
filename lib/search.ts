import type { Product } from "@/types/product";
import { applicationLabels, formatLabels, orderTypeLabels, products as defaultProducts } from "@/data/products";

/**
 * PRODUCT SEARCH
 * --------------------------------------------------------------------
 * A catalogue of nine products does not need an index, a worker or a
 * fuzzy-search dependency — it needs a substring match over the fields a
 * buyer would actually type. Every term must match somewhere (AND), so
 * "square export" narrows instead of widening.
 *
 * Kept as a pure function so it can be unit-tested and reused anywhere.
 */

function haystack(
  p: Product,
  labels = { format: formatLabels, application: applicationLabels, orderType: orderTypeLabels },
): string {
  return [
    p.name,
    p.shortName,
    p.category,
    p.tagline,
    p.shortDescription,
    labels.format[p.format],
    ...p.application.map((a) => labels.application[a]),
    ...p.orderType.map((o) => labels.orderType[o]),
    ...(p.keywords ?? []),
    ...p.bestFor,
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Search a catalogue. The list is passed in so each locale searches its
 * own translated names — an Arabic buyer typing «مربّعة» must find the
 * square bale, which searching the English catalogue would never do.
 */
export function searchProducts(
  query: string,
  options: { products?: Product[]; limit?: number; labels?: Parameters<typeof haystack>[1] } = {},
): Product[] {
  const { products = defaultProducts, limit = 6, labels } = options;
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return products
    .map((product) => ({ product, text: haystack(product, labels) }))
    .filter((entry) => terms.every((term) => entry.text.includes(term)))
    .slice(0, limit)
    .map((entry) => entry.product);
}
