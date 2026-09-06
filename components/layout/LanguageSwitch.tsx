"use client";

import { Globe, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { isActiveLocale, locales, localePath, stripLocale, type LocaleCode } from "@/lib/i18n";
import { siteConfig } from "@/data/site-config";
import { useCopy, useLocale } from "@/lib/locale-client";
import { cn } from "@/lib/utils";

/**
 * LANGUAGE SWITCHER
 * --------------------------------------------------------------------
 * Switches language *without leaving the page*: it strips the locale
 * from the current path and re-prefixes it, so a buyer reading
 * /ar/products/premium-round-bale lands on the English version of that
 * same product, not on the homepage.
 *
 * Locales listed in site-config but not yet translated (`activeLocales`
 * in lib/i18n.ts) are shown as unavailable rather than linking to a
 * half-translated page — the same rule the rest of the site follows.
 *
 * The links are plain <a>/<Link> elements, so the language choice is
 * crawlable and works without JavaScript.
 */
export function LanguageSwitch({ tone = "light" }: { tone?: "light" | "dark" }) {
  const copy = useCopy();
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = locales[locale];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The path without any locale prefix — the same page in every language.
  const { path } = stripLocale(pathname);
  const light = tone === "light";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={copy.common.language}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 items-center gap-2 rounded-full border px-3.5 text-[0.75rem] font-semibold tracking-[0.12em] uppercase transition-colors",
          light
            ? "border-cream/20 text-cream/85 hover:border-cream/60 hover:bg-cream/10"
            : "border-ink/20 text-ink hover:border-ink/60",
        )}
      >
        <Globe className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        <span dir="ltr">{current.code}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={copy.common.language}
          className={cn(
            "absolute end-0 top-[calc(100%+0.5rem)] z-50 min-w-48 rounded-[2px] border p-1.5 shadow-2xl",
            light ? "border-cream/15 bg-ink text-cream" : "border-ink/15 bg-cream text-ink",
          )}
        >
          {siteConfig.languages.map((code) => {
            const l = locales[code];
            const active = code === locale;
            const available = isActiveLocale(code);

            const row = (
              <span className="flex w-full items-center justify-between gap-4">
                <span>
                  {l.nativeLabel}
                  {!available && (
                    <span
                      className="ms-2 text-[0.625rem] uppercase tracking-[0.15em] opacity-70"
                      dir="ltr"
                    >
                      {copy.common.languageSoon}
                    </span>
                  )}
                </span>
                {active && <Check className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />}
              </span>
            );

            return (
              <li
                key={code}
                role="option"
                aria-selected={active}
                aria-disabled={!available}
                dir={l.dir}
                className={cn(
                  "rounded-[2px] text-sm",
                  available ? "opacity-100" : "opacity-55",
                )}
              >
                {available && !active ? (
                  // A full path, so it bypasses LocaleLink's prefixing —
                  // this link deliberately changes language.
                  <NextLink
                    href={localePath(path, code as LocaleCode)}
                    hrefLang={l.htmlLang}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center px-3 py-2.5 transition-colors",
                      light ? "hover:bg-cream/10" : "hover:bg-ink/5",
                    )}
                  >
                    {row}
                  </NextLink>
                ) : (
                  <span className="flex min-h-11 items-center px-3 py-2.5">{row}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
