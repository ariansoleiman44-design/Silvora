"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { usePathname } from "next/navigation";
import { Menu, Package, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { ProductSearch } from "@/components/search/ProductSearch";
import { useDict } from "@/lib/locale-client";

import { useCopy } from "@/lib/locale-client";
import { siteConfig } from "@/data/site-config";
import { useQuote } from "@/lib/quote-store";
import { cn } from "@/lib/utils";

export function Header() {
  const copy = useCopy();
  const mainNav = useDict().nav.main;
  const pathname = usePathname();
  // The menu remembers the path it was opened on, so a route change
  // (including browser back/forward) closes it without an effect.
  const [menu, setMenu] = useState<{ open: boolean; path: string }>({ open: false, path: "" });
  const menuOpen = menu.open && menu.path === pathname;
  const setMenuOpen = (open: boolean) => setMenu({ open, path: pathname });
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const quote = useQuote();

  // Compact + glass background after a small scroll; hide on scroll-down
  // (mobile-friendly), reveal on scroll-up.
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        const goingDown = y > lastY && y > 240;
        setHidden(goingDown && !menuOpen && !quote.isOpen);
        lastY = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [menuOpen, quote.isOpen]);

  // "/" opens search — ignored while the visitor is typing somewhere.
  useEffect(() => {
    if (!siteConfig.features.searchEnabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (typing) return;
      e.preventDefault();
      setSearchOpen(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const count = quote.hydrated ? quote.count : 0;

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        {copy.common.skipToContent}
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] text-cream transition-[transform,background-color,border-color,backdrop-filter] duration-500 ease-[var(--ease-luxe)]",
          scrolled
            ? "border-b border-cream/10 bg-ink/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
        )}
      >
        {/* Legibility gradient over hero imagery before scroll */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-ink/60 to-transparent transition-opacity duration-500",
            scrolled ? "opacity-0" : "opacity-100",
          )}
        />
        <div
          className={cn(
            "container-x flex items-center justify-between gap-4 transition-[height] duration-500 ease-[var(--ease-luxe)]",
            scrolled ? "h-16" : "h-[4.5rem] md:h-[5.25rem]",
          )}
        >
          <Link href="/" aria-label={`${siteConfig.brandName} — home`} className="relative z-10 shrink-0">
            <Logo variant="horizontal" tone="light" ribColor="transparent" className="text-[1.05rem] md:text-[1.2rem]" />
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8 xl:gap-10">
              {mainNav.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "link-line text-[0.8125rem] font-medium tracking-[0.04em] transition-colors",
                        active ? "text-cream" : "text-cream/75 hover:text-cream",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden lg:block">
              <LanguageSwitch />
            </div>

            {siteConfig.features.searchEnabled && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={copy.header.search}
                className="hidden h-11 w-11 place-items-center rounded-full border border-cream/20 transition-colors hover:border-cream/60 hover:bg-cream/10 md:grid"
              >
                <Search className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.5} aria-hidden />
              </button>
            )}

            <button
              type="button"
              onClick={quote.open}
              aria-label={`${copy.header.quoteAria}${count ? ` (${count})` : ""}`}
              className="relative grid h-11 w-11 place-items-center rounded-full border border-cream/20 transition-colors hover:border-cream/60 hover:bg-cream/10"
            >
              <Package className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.5} aria-hidden />
              {count > 0 && (
                <span className="mono-num absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[0.625rem] font-semibold text-ink">
                  {count}
                </span>
              )}
            </button>

            <span className="hidden md:block">
              <Button href="/quote" variant="gold" size="sm" icon="none">
                {copy.common.requestQuote}
              </Button>
            </span>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? copy.common.close : copy.common.menu}
              className="grid h-11 w-11 place-items-center rounded-full border border-cream/20 transition-colors hover:border-cream/60 hover:bg-cream/10 lg:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSearch={() => {
          setMenuOpen(false);
          setSearchOpen(true);
        }}
      />

      {siteConfig.features.searchEnabled && searchOpen && (
        <ProductSearch onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
