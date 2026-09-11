import type { Product } from "@/types/product";
import { applicationLabels, formatLabels, orderTypeLabels } from "../data/product-labels.ts";

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
 * Search a catalogue. The list is REQUIRED, not defaulted: each locale
 * must search its own translated names — an Arabic buyer typing
 * «مربّعة» must find the square bale, which searching the English
 * catalogue would never do. This used to default to the English
 * catalogue, which both made that failure silent and pulled all nine
 * products into the browser bundle for every visitor.
 */
/**
 * Fold Arabic-script text so a buyer's typing matches the catalogue.
 *
 * Arabic, Sorani and Badini copy is written properly — with hamza seats
 * (أ إ آ), taa marbuta (ة) and sometimes vowel marks. Almost nobody
 * types those on a phone: a buyer searching for the square bale types
 * «مربعة» or even «مربعه», while the catalogue says «مربّعة». A plain
 * substring match therefore returned NOTHING for Arabic and Kurdish
 * buyers, on a site whose whole point is Arabic and Kurdish buyers.
 *
 * Folding both sides makes the common spellings equivalent:
 *   - drop tashkeel (vowel marks) and tatweel
 *   - أ إ آ ٱ  ->  ا
 *   - ى -> ي,  ة -> ه
 *   - Arabic-Indic digits -> ASCII, so "٤٠" finds "40"
 *
 * Latin text is unaffected, so English search is unchanged.
 */
export function foldSearchText(value: string): string {
  return value
    .normalize("NFKD")
    /*
     * Tashkeel and tatweel carry no search signal. The range runs to
     * U+0655 on purpose: NFKD above has already decomposed أ إ آ into a
     * plain alif plus a COMBINING hamza (U+0654/U+0655) or maddah
     * (U+0653), so stripping only to U+0652 would leave the mark behind
     * and the fold would not actually fold.
     */
    .replace(/[\u064B-\u0655\u0670\u0640]/g, "")
    // Any precomposed forms NFKD did not decompose.
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    // Arabic-Indic and Eastern Arabic-Indic digits.
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .toLowerCase();
}

export function searchProducts(
  query: string,
  options: { products: Product[]; limit?: number; labels?: Parameters<typeof haystack>[1] },
): Product[] {
  const { products, limit = 6, labels } = options;
  const terms = foldSearchText(query.trim()).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return products
    .map((product) => ({ product, text: foldSearchText(haystack(product, labels)) }))
    .filter((entry) => terms.every((term) => entry.text.includes(term)))
    .slice(0, limit)
    .map((entry) => entry.product);
}
