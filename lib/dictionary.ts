import { getDictionaryFor, type Dictionary } from "@/data/dictionaries";
import { getRequestLocale } from "@/lib/locale-server";
import { defaultLocale, getLocale, type LocaleCode } from "@/lib/i18n";

/**
 * CONTENT ACCESS (server components)
 * --------------------------------------------------------------------
 * `getDictionary()` resolves the active locale's content for the current
 * request. Client components use `useDict()` / `useCopy()` from
 * lib/locale-client.tsx instead — same shape, different plumbing.
 *
 *   const copy = getCopy();          // UI strings
 *   const { products } = getDictionary();
 */

export function getDictionary(locale?: LocaleCode): Dictionary {
  return getDictionaryFor(locale ?? getRequestLocale());
}

/** Shorthand for UI copy — the shape components already expect. */
export function getCopy(locale?: LocaleCode) {
  return getDictionary(locale).copy;
}

/** The active locale for this request. */
export function getActiveLocale(): LocaleCode {
  return getRequestLocale();
}

/** Text direction for the active locale. */
export function getDir(): "ltr" | "rtl" {
  return getLocale(getRequestLocale()).dir;
}

/**
 * Locale-aware href for server components.
 * `/products` → `/products` in English, `/ar/products` in Arabic.
 */
export function withLocale(path: string, locale = getRequestLocale()): string {
  if (locale === defaultLocale) return path;
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
