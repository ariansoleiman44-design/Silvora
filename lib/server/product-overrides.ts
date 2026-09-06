import { unstable_cache } from "next/cache";
import type { Product } from "@/types/product";
import type { LocaleCode } from "@/lib/i18n";
import { defaultLocale } from "@/lib/i18n";
import { getDictionaryFor } from "@/data/dictionaries";
import { applyPatch } from "@/lib/product-schema";
import { isSupabaseConfigured, selectRows } from "@/lib/server/supabase";
import { reportError } from "@/lib/observability";

/**
 * ADMIN EDITS, LAYERED OVER THE CODE CATALOGUE
 * --------------------------------------------------------------------
 * The database does not hold products. It holds patches. The render
 * order is:
 *
 *   data/products.ts            the committed catalogue
 *     ↓
 *   data/{ar,ckb,kmr}/…         the file translation overlays
 *     ↓
 *   product_overrides "en"      base patch — facts, all languages
 *     ↓
 *   product_overrides "<loc>"   translation patch — text, one language
 *
 * Consequences worth stating plainly:
 *
 *   - An empty table renders exactly what is in git. Reverting the
 *     whole panel is `delete from product_overrides`.
 *   - Static generation survives. Pages are cached under the tag below
 *     and rebuilt when the panel publishes, not on every request.
 *   - If the database is down or unconfigured, every read falls back to
 *     the committed catalogue. The public site cannot be taken offline
 *     by the admin panel — the worst case is that it shows yesterday's
 *     content, which is the same thing it showed before the panel
 *     existed.
 */

export const OVERRIDES_TAG = "product-overrides";

interface OverrideRecord {
  slug: string;
  locale: string;
  patch: Record<string, unknown>;
}

/**
 * Every patch, keyed "slug:locale".
 *
 * Cached under OVERRIDES_TAG so product pages stay static between
 * publishes. The panel calls revalidateTag(OVERRIDES_TAG) after a
 * write, which is what makes an edit appear on the public site.
 */
const loadOverrides = unstable_cache(
  async (): Promise<Record<string, Record<string, unknown>>> => {
    if (!isSupabaseConfigured()) return {};
    try {
      const rows = await selectRows<OverrideRecord>("product_overrides", {
        select: "slug,locale,patch",
      });
      const map: Record<string, Record<string, unknown>> = {};
      for (const row of rows) {
        if (row.patch && typeof row.patch === "object") {
          map[`${row.slug}:${row.locale}`] = row.patch;
        }
      }
      return map;
    } catch (error) {
      // A failed read must never take the catalogue down with it.
      reportError(error, { scope: "product-overrides", category: "read" });
      return {};
    }
  },
  ["product-overrides"],
  { tags: [OVERRIDES_TAG] },
);

/** Apply the base patch and then the locale patch to one product. */
function patchProduct(
  product: Product,
  locale: LocaleCode,
  overrides: Record<string, Record<string, unknown>>,
): Product {
  let next = product;

  const base = overrides[`${product.slug}:${defaultLocale}`];
  if (base) next = applyPatch(next, base, defaultLocale);

  if (locale !== defaultLocale) {
    const translation = overrides[`${product.slug}:${locale}`];
    if (translation) next = applyPatch(next, translation, locale);
  }

  return next;
}

/**
 * The product catalogue for a locale, with admin edits applied.
 *
 * Server-only. Use this anywhere a page renders products; the plain
 * `getDictionaryFor(locale).products` remains the un-patched base and
 * is what the panel shows as "code default" when it renders a diff.
 */
export async function getProductsFor(locale: LocaleCode): Promise<Product[]> {
  const base = getDictionaryFor(locale).products;
  const overrides = await loadOverrides();
  if (Object.keys(overrides).length === 0) return base;
  return base.map((product) => patchProduct(product, locale, overrides));
}

export async function getProductFor(locale: LocaleCode, slug: string): Promise<Product | undefined> {
  const products = await getProductsFor(locale);
  return products.find((p) => p.slug === slug);
}

/**
 * The stored patches themselves, for the editor. Reads straight through
 * rather than via the cache: an editor must see what they just saved,
 * not a cached copy of what it was before.
 */
export async function readOverridesUncached(): Promise<OverrideRecord[]> {
  if (!isSupabaseConfigured()) return [];
  return selectRows<OverrideRecord>("product_overrides", {
    select: "slug,locale,patch",
    order: { column: "slug", ascending: true },
  });
}
