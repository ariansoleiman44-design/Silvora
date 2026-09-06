/**
 * LOCALE TABLE
 * --------------------------------------------------------------------
 * Deliberately import-free, like data/site-config.ts: the validation and
 * launch-audit scripts read this file directly under plain Node, which
 * cannot resolve the "@/" alias. Keep it that way.
 *
 * lib/i18n.ts builds the routing helpers on top of this.
 */

export type LocaleCode = "en" | "ar" | "ku";

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
  ku: {
    code: "ku",
    label: "Kurdish (Sorani)",
    nativeLabel: "کوردی",
    dir: "rtl",
    htmlLang: "ckb",
    intlLocale: "ckb-u-nu-latn",
  },
};

/** Served from the root, without a path prefix. */
export const defaultLocale: LocaleCode = "en";

/** Locales that are actually translated and safe to link to. */
export const activeLocales: LocaleCode[] = ["en", "ar"];
