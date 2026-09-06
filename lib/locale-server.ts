import { cache } from "react";
import { defaultLocale, isActiveLocale, type LocaleCode } from "@/lib/i18n";

/**
 * REQUEST-SCOPED LOCALE (server components)
 * --------------------------------------------------------------------
 * Server components deep in the tree cannot receive `params`, and React
 * context does not exist on the server. `cache()` gives us a per-request
 * store instead: the locale layout writes the active locale once, and
 * any server component reads it without prop drilling.
 *
 * The cache is scoped to a single render pass, so two concurrent
 * requests in different languages cannot see each other's value.
 *
 * Client components use `useLocale()` from lib/locale-client.tsx.
 */

const store = cache((): { locale: LocaleCode } => ({ locale: defaultLocale }));

/** Called once by app/[locale]/layout.tsx, before anything renders. */
export function setRequestLocale(locale: string | undefined): LocaleCode {
  const next = isActiveLocale(locale) ? locale : defaultLocale;
  store().locale = next;
  return next;
}

/** The locale for the current request. Defaults to English. */
export function getRequestLocale(): LocaleCode {
  return store().locale;
}
