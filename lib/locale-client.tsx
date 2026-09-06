"use client";

import { createContext, useContext, type ReactNode } from "react";
import { defaultLocale, type LocaleCode } from "@/lib/i18n";
import type { Dictionary } from "@/data/dictionaries";

/**
 * LOCALE CONTEXT (client components)
 * --------------------------------------------------------------------
 * The dictionary is resolved on the server and handed to the client as
 * a plain object, so no client component imports every language's copy
 * and the Arabic strings are absent from the English bundle.
 *
 * Server components use `getDictionary()` from lib/dictionary.ts.
 */

interface LocaleContextValue {
  locale: LocaleCode;
  dir: "ltr" | "rtl";
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dir,
  dict,
  children,
}: LocaleContextValue & { children: ReactNode }) {
  return (
    <LocaleContext.Provider value={{ locale, dir, dict }}>{children}</LocaleContext.Provider>
  );
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale/useCopy must be used inside <LocaleProvider>");
  }
  return ctx;
}

export function useLocale(): LocaleCode {
  return useLocaleContext().locale;
}

export function useDir(): "ltr" | "rtl" {
  return useLocaleContext().dir;
}

/** The active dictionary. The client mirror of `getDictionary()`. */
export function useDict(): Dictionary {
  return useLocaleContext().dict;
}

/** Shorthand for the UI copy — the shape components already expect. */
export function useCopy(): Dictionary["copy"] {
  return useLocaleContext().dict.copy;
}

/** Locale-aware href: "/products" → "/ar/products" in Arabic. */
export function useLocalePath(): (path: string) => string {
  const { locale } = useLocaleContext();
  return (path: string) => {
    if (locale === defaultLocale) return path;
    if (!path.startsWith("/") || path.startsWith("//")) return path;
    return path === "/" ? `/${locale}` : `/${locale}${path}`;
  };
}
