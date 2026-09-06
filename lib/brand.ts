import { siteConfig } from "@/data/site-config";
import type { LocaleCode } from "@/lib/i18n";

/**
 * THE BRAND NAME, PER LANGUAGE
 * --------------------------------------------------------------------
 * The supplied logo is a bilingual lockup: "Corn Fodder" beside
 * علف الذرة. So the Arabic pages carry the Arabic form of the name, and
 * everything else carries the Latin one.
 *
 * Kurdish is deliberately NOT translated. A brand is a name, not a
 * phrase, and inventing a Kurdish trading name that no native speaker
 * has approved would be worse than leaving it in Latin — which is also
 * what keeps one searchable name across documents and invoices.
 *
 * This is plain data with no server-only imports, so the client Header
 * and the server Footer can both use it.
 *
 * Note this is the DISPLAY name. Inside Arabic body copy the Latin form
 * is used ("سيلاج Corn Fodder"), which is how the Arabic translation was
 * written and normal practice for a trademark inside running text.
 */
const NAMES: Partial<Record<LocaleCode, string>> = {
  ar: "علف الذرة",
};

export function brandNameFor(locale: LocaleCode | string | undefined): string {
  if (!locale) return siteConfig.brandName;
  return NAMES[locale as LocaleCode] ?? siteConfig.brandName;
}
