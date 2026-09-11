import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Instrument_Serif, Manrope, Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileQuoteBar } from "@/components/layout/MobileQuoteBar";
import { QuoteDrawer } from "@/components/quote/QuoteDrawer";
import { JsonLd } from "@/components/seo/JsonLd";
import { QuoteProvider } from "@/lib/quote-store";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { LocaleProvider } from "@/lib/locale-client";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { siteConfig } from "@/data/site-config";
import { remoteImageOrigin } from "@/data/media";
import { siteOrigin } from "@/lib/site-url";
import { activeLocales, getLocale, isActiveLocale, localePath } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { getDictionaryFor } from "@/data/dictionaries";
import { cn } from "@/lib/utils";

/**
 * FONTS
 * --------------------------------------------------------------------
 * Two scripts, one voice.
 *
 *   Latin   Instrument Serif (display) + Manrope (text)
 *   Arabic  Amiri (display) + IBM Plex Sans Arabic (text)
 *
 * Amiri is a Naskh face with the same editorial, slightly classical
 * weight as Instrument Serif — it carries an Arabic headline without
 * looking like a system default, which is exactly the failure mode that
 * makes a translated site feel machine-made. IBM Plex Sans Arabic is
 * the text companion: it shares Manrope's neutral, engineered tone and
 * has the same generous x-height.
 *
 * The `[dir="rtl"]` block in globals.css swaps the CSS variables, so no
 * component needs to know which script it is rendering.
 *
 * PRELOADING IS OFF ON PURPOSE. next/font decides what to preload from
 * the module graph, not from what the page actually renders: with
 * `preload: true` an English page emitted preload links for all nine
 * font files — 390 KB, of which the 337 KB of Arabic never draws a
 * single glyph — and that download competes with the hero image for
 * bandwidth on the LCP path.
 *
 * With preloading off the @font-face rules still ship in the initial
 * CSS, so the browser starts each fetch as soon as it lays out text
 * that needs the face, and only for the script actually on the page.
 * The cost is one round trip; `display: swap` covers it with the
 * fallback stacks declared in globals.css.
 */
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
  preload: false,
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

const displayAr = Amiri({
  subsets: ["arabic"],
  // Only 400: the site has no bold display type in either script.
  weight: ["400"],
  variable: "--font-display-ar",
  display: "swap",
  preload: false,
});

const sansAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  // 400/500/600 map to font-normal/-medium/-semibold, which is every
  // weight the site actually uses. 700 was dead.
  weight: ["400", "500", "600"],
  variable: "--font-sans-ar",
  display: "swap",
  preload: false,
});

/** Pre-render every locale at build time. */
export function generateStaticParams() {
  return activeLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const active = isActiveLocale(locale) ? locale : "en";
  const dict = getDictionaryFor(active);
  const meta = getLocale(active);

  return {
    metadataBase: new URL(siteOrigin),
    title: {
      default: dict.copy.seo?.defaultTitle ?? siteConfig.seo.defaultTitle,
      template: siteConfig.seo.titleTemplate,
    },
    description: dict.copy.seo?.defaultDescription ?? siteConfig.seo.defaultDescription,
    applicationName: siteConfig.brandName,
    openGraph: {
      type: "website",
      siteName: siteConfig.brandName,
      locale: meta.htmlLang,
      title: dict.copy.seo?.defaultTitle ?? siteConfig.seo.defaultTitle,
      description: dict.copy.seo?.defaultDescription ?? siteConfig.seo.defaultDescription,
      images: [{ url: siteConfig.seo.ogImage, width: 1200, height: 630, alt: siteConfig.brandName }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.copy.seo?.defaultTitle ?? siteConfig.seo.defaultTitle,
      description: dict.copy.seo?.defaultDescription ?? siteConfig.seo.defaultDescription,
      images: [siteConfig.seo.ogImage],
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${siteOrigin}${localePath("/", active)}`,
      // Every page declares its siblings, so a search engine serves an
      // Arabic-speaking buyer the Arabic page.
      languages: Object.fromEntries(
        activeLocales.map((l) => [getLocale(l).htmlLang, `${siteOrigin}${localePath("/", l)}`]),
      ),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0d100e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isActiveLocale(locale)) notFound();

  // Publishes the locale for every server component in this request —
  // see lib/locale-server.ts. Must run before anything renders.
  setRequestLocale(locale);

  const meta = getLocale(locale);
  const dict = getDictionaryFor(locale);

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      className={cn(meta.dir === "rtl" ? cn(displayAr.variable, sansAr.variable) : cn(display.variable, sans.variable))}
      // Tells Next the smooth scrolling in globals.css is deliberate, so
      // it suppresses it during route transitions instead of warning.
      data-scroll-behavior="smooth"
      id="top"
    >
      <head>
        {/*
          The hero image is the LCP element on most pages and it lives on
          another origin, so without this the browser pays a DNS lookup
          and a TLS handshake before the first byte of it moves. Opening
          the connection while the HTML is still parsing takes that off
          the critical path. Drop this line when the photography moves
          to /public — see data/media.ts.
        */}
        <link rel="preconnect" href={remoteImageOrigin} crossOrigin="anonymous" />
        {/*
          Scroll reveals (components/ui/Reveal.tsx) start hidden, and
          Framer serialises that into the server HTML as an inline
          style. Without JavaScript nothing ever reveals them, so whole
          sections of the page would stay permanently invisible rather
          than merely un-animated.

          The page above the fold no longer depends on JS at all — see
          template.tsx — and this makes the rest degrade the same way:
          no animation, but everything readable.
        */}
        <noscript>
          {/* eslint-disable-next-line react/no-danger */}
          <style
            dangerouslySetInnerHTML={{
              __html:
                '[style*="opacity:0"]{opacity:1!important}[style*="translateY"],[style*="translateX"]{transform:none!important}',
            }}
          />
        </noscript>
      </head>
      <body>
        <LocaleProvider locale={locale} dir={meta.dir} dict={dict}>
          <MotionProvider>
            <QuoteProvider>
              <Header />
              <main id="content">{children}</main>
              <Footer />
              <QuoteDrawer />
              <MobileQuoteBar />
            </QuoteProvider>
          </MotionProvider>
        </LocaleProvider>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}
