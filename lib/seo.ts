import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";
import { isEmailConfigured, isPhoneConfigured, normalizePhone } from "@/lib/contact";
import { absoluteUrl, siteOrigin } from "@/lib/site-url";
import { activeLocales, defaultLocale, getLocale, localePath, type LocaleCode } from "@/lib/i18n";
import { media } from "@/data/media";
import type { Product } from "@/types/product";
import type { Faq } from "@/data/faqs";
import { formatLabels } from "@/data/products";

/**
 * SEO helpers: page metadata and JSON-LD builders.
 * No ratings, prices or fabricated review data are ever emitted.
 */

interface PageMeta {
  title: string;
  description: string;
  /** Canonical, UNPREFIXED path — e.g. "/products". */
  path: string;
  /** Locale this page is being rendered in. Defaults to English. */
  locale?: LocaleCode;
  /**
   * Share image. Pass `null` to omit it entirely so Next's file-based
   * `opengraph-image` convention wins (product pages generate their own).
   */
  image?: string | null;
  noIndex?: boolean;
}

// Canonical URL building lives in lib/site-url.ts, which normalises the
// origin and refuses example.com / localhost / http in production.
export { absoluteUrl, siteOrigin, siteUrlIsValid } from "@/lib/site-url";

export function buildMetadata({
  title,
  description,
  path,
  locale = defaultLocale,
  image,
  noIndex,
}: PageMeta): Metadata {
  const url = absoluteUrl(localePath(path, locale));
  // `null` means "let the generated opengraph-image handle it".
  const ogImage = image === null ? null : (image ?? siteConfig.seo.ogImage);
  return {
    title,
    description,
    alternates: {
      canonical: url,
      /*
       * Every page points at its own translations. Without this a search
       * engine has no way to know the Arabic page exists, and an
       * Arabic-speaking buyer is served the English one.
       */
      languages: Object.fromEntries(
        activeLocales.map((l) => [getLocale(l).htmlLang, absoluteUrl(localePath(path, l))]),
      ),
    },
    openGraph: {
      title,
      description,
      url,
      locale: getLocale(locale).htmlLang,
      siteName: siteConfig.brandName,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
      ...(siteConfig.seo.twitterHandle ? { site: siteConfig.seo.twitterHandle } : {}),
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

/* ------------------------------------------------------------ JSON-LD */

/**
 * Organization schema.
 *
 * Only real, configured values are emitted. A placeholder phone number,
 * an @example.com address or a `#` social link is omitted entirely
 * rather than published as fact — search engines treat this as business
 * identity, and wrong identity data is worse than absent identity data.
 */
export function organizationJsonLd() {
  const legal = siteConfig.legal;
  const socials = siteConfig.socials
    .map((s) => s.href)
    .filter((href) => href && href !== "#" && /^https?:\/\//i.test(href));

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: legal.name,
    alternateName: siteConfig.brandName,
    url: siteOrigin,
    logo: absoluteUrl("/icon.svg"),
    description: siteConfig.statement,
    ...(isEmailConfigured() ? { email: siteConfig.contact.email } : {}),
    ...(isPhoneConfigured() ? { telephone: normalizePhone(siteConfig.contact.phone) } : {}),
    ...(legal.registrationNumber ? { identifier: legal.registrationNumber } : {}),
    ...(legal.taxNumber ? { taxID: legal.taxNumber } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.brandName,
    url: siteOrigin,
    inLanguage: "en",
  };
}

/**
 * Product structured data.
 *
 * Two deliberate omissions: no `offers` and no `aggregateRating` —
 * pricing is quoted per order and there are no reviews to report.
 *
 * Demo specifications are also excluded. Publishing a placeholder weight
 * as a machine-readable property would put a figure we cannot stand
 * behind into search results, which is worse than publishing nothing.
 */
export function productJsonLd(product: Product) {
  const images = product.images.map((k) => media[k].src);
  const specs = [
    product.weight,
    product.dimensions,
    product.wrapping,
    product.chop,
    product.moisture,
  ].filter((s): s is NonNullable<typeof s> => Boolean(s) && !s?.demo);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: images,
    category: `Corn silage — ${formatLabels[product.format]} bale`,
    brand: { "@type": "Brand", name: siteConfig.brandName },
    url: absoluteUrl(`/products/${product.slug}`),
    ...(specs.length
      ? {
          additionalProperty: specs.map((s) => ({
            "@type": "PropertyValue",
            name: s.label,
            value: s.value,
          })),
        }
      : {}),
  };
}

export function faqJsonLd(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
