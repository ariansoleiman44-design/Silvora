/**
 * LOCALE TABLE
 * --------------------------------------------------------------------
 * Deliberately import-free, like data/site-config.ts: the validation and
 * launch-audit scripts read this file directly under plain Node, which
 * cannot resolve the "@/" alias. Keep it that way.
 *
 * lib/i18n.ts builds the routing helpers on top of this.
 */

/**
 * ISO 639-3 codes, because "ku" is a macrolanguage and this site serves
 * two distinct Kurdish varieties that are not mutually interchangeable
 * in writing:
 *
 *   ckb  Central Kurdish (Sorani)  — Erbil, Sulaymaniyah
 *   kmr  Northern Kurdish (Kurmanji/Badini) — Duhok
 *
 * Both are written here in the Arabic script, as they are in Iraq.
 * Labelling them both "ku" would let a Badini reader be served Sorani.
 */
export type LocaleCode = "en" | "ar" | "ckb" | "kmr";

export interface LocaleMeta {
  code: LocaleCode;
  /** English name, for hreflang tooling and internal labels. */
  label: string;
  /** How the language names itself — what the switcher shows. */
  nativeLabel: string;
  dir: "ltr" | "rtl";
  /** BCP-47 tag for <html lang>. */
  htmlLang: string;
  /** Locale tag for Intl number/date formatting. */
  intlLocale: string;
}

export const locales: Record<LocaleCode, LocaleMeta> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    dir: "ltr",
    htmlLang: "en",
    intlLocale: "en",
  },
  ar: {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    dir: "rtl",
    htmlLang: "ar",
    // Western digits, not Arabic-Indic: Iraqi commercial and technical
    // documents are written with 0–9, and a quantity a buyer has to read
    // back over the phone must match what is on the invoice.
    intlLocale: "ar-IQ-u-nu-latn",
  },
  ckb: {
    code: "ckb",
    label: "Kurdish (Sorani)",
    nativeLabel: "کوردیی سۆرانی",
    dir: "rtl",
    htmlLang: "ckb",
    intlLocale: "ckb-u-nu-latn",
  },
  kmr: {
    code: "kmr",
    label: "Kurdish (Badini)",
    nativeLabel: "کوردیا بادینی",
    dir: "rtl",
    // Kurmanji is Latin-script by default, so the script subtag is not
    // optional here — this is the Arabic-script variety used in Iraq.
    htmlLang: "kmr-Arab",
    intlLocale: "ku-Arab-IQ-u-nu-latn",
  },
};

/** Served from the root, without a path prefix. */
export const defaultLocale: LocaleCode = "en";

/** Locales that are actually translated and safe to link to. */
/**
 * Locales that are translated AND reviewed well enough to link to.
 *
 * `kmr` (Badini) is deliberately absent: the translation exists in
 * data/kmr/ but has not been checked by a native speaker, and Kurmanji
 * in Arabic script is not standardised enough to ship unreviewed. It
 * shows in the switcher as unavailable. Add "kmr" here once a Badini
 * speaker has been through docs/KMR-REVIEW.md.
 */
export const activeLocales: LocaleCode[] = ["en", "ar", "ckb"];
