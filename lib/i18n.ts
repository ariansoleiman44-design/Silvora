import { activeLocales, defaultLocale, locales, type LocaleCode, type LocaleMeta } from "@/data/locales";

/**
 * LOCALES
 * --------------------------------------------------------------------
 * English is the default and lives at the root (`/products`). Every
 * other locale is prefixed (`/ar/products`). A middleware rewrite maps
 * the unprefixed English paths onto the same `app/[locale]` tree, so
 * there is one set of route files and no duplicated pages.
 *
 * Adding a locale is three steps:
 *   1. add it to `activeLocales` below
 *   2. add its dictionary in data/dictionaries.ts
 *   3. translate — nothing else in the app needs to change
 *
 * A locale that is declared in site-config but NOT in `activeLocales`
 * appears in the switcher as unavailable rather than linking to a
 * half-translated page.
 */

export type { LocaleCode, LocaleMeta };
export { locales, defaultLocale, activeLocales };

export function isActiveLocale(value: string | undefined): value is LocaleCode {
  return Boolean(value) && activeLocales.includes(value as LocaleCode);
}

export function getLocale(code: LocaleCode = defaultLocale): LocaleMeta {
  return locales[code] ?? locales[defaultLocale];
}

/** True when a locale is written right-to-left. */
export const isRtl = (code: LocaleCode): boolean => getLocale(code).dir === "rtl";

/* ------------------------------------------------------------------ */
/* Paths                                                               */
/* ------------------------------------------------------------------ */

/**
 * Prefix a path for a locale. The default locale is unprefixed, so
 * existing English URLs never change.
 *
 *   localePath("/products", "en") → "/products"
 *   localePath("/products", "ar") → "/ar/products"
 *   localePath("/", "ar")         → "/ar"
 */
export function localePath(path: string, locale: LocaleCode = defaultLocale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  if (clean === "/") return `/${locale}`;
  return `/${locale}${clean}`;
}

/**
 * Strip a locale prefix back to the canonical, unprefixed path.
 *
 *   "/ar/products"  → { locale: "ar",  path: "/products" }
 *   "/ckb"          → { locale: "ckb", path: "/" }
 *   "/products"     → { locale: "en",  path: "/products" }
 *
 * Matched against the real locale list rather than a length pattern: an
 * earlier version tested /^\/([a-z]{2})\b/ and silently failed on the
 * three-letter codes (ckb, kmr), so switching language from a Kurdish
 * page produced "/ar/ckb".
 */
export function stripLocale(pathname: string): { locale: LocaleCode; path: string } {
  const segments = (pathname || "/").split("/");
  const candidate = segments[1]?.toLowerCase();

  for (const locale of activeLocales) {
    if (locale === defaultLocale) continue;
    if (candidate === locale) {
      const rest = segments.slice(2).join("/");
      return { locale, path: rest ? `/${rest}` : "/" };
    }
  }
  return { locale: defaultLocale, path: pathname || "/" };
}

/**
 * MULTILINGUAL NOTES
 * --------------------------------------------------------------------
 * Layout: components use logical properties (ps-/pe-/start-/end-/ms-/me-)
 * throughout, so RTL mirrors without per-component work. Directional
 * icons carry `rtl:-scale-x-100`.
 *
 * Numbers: quantities, weights and references stay in Western digits in
 * every locale — see `intlLocale` above.
 *
 * Brand: SILVORA is a proper noun and stays in Latin script in all
 * locales, including inside Arabic sentences.
 */
