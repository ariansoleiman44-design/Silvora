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
 */
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const displayAr = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-display-ar",
  display: "swap",
});

const sansAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-ar",
  display: "swap",
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
      className={cn(display.variable, sans.variable, displayAr.variable, sansAr.variable)}
      // Tells Next the smooth scrolling in globals.css is deliberate, so
      // it suppresses it during route transitions instead of warning.
      data-scroll-behavior="smooth"
      id="top"
    >
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
