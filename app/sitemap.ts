import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";
import { products } from "@/data/products";
import { publishedCaseStudies } from "@/data/case-studies";
import { activeLocales, getLocale, localePath } from "@/lib/i18n";

/**
 * SITEMAP
 * --------------------------------------------------------------------
 * Every route is listed once per translated locale, and each entry
 * declares its siblings through `alternates.languages`. That is what
 * tells a search engine the Arabic page exists and is the same page —
 * without it, only English is ever indexed.
 *
 * Locales that are not translated (see `activeLocales`) are absent, the
 * same rule the language switcher follows.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/products", changeFrequency: "weekly", priority: 0.9 },
    { path: "/quality", changeFrequency: "monthly", priority: 0.7 },
    { path: "/process", changeFrequency: "monthly", priority: 0.6 },
    { path: "/logistics", changeFrequency: "monthly", priority: 0.7 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/quote", changeFrequency: "monthly", priority: 0.8 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
    { path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
    ...products.map((p) => ({
      path: `/products/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  // /results is listed only once a real case study is published.
  if (publishedCaseStudies().length > 0) {
    routes.push({ path: "/results", changeFrequency: "monthly", priority: 0.6 });
  }

  return routes.flatMap((route) =>
    activeLocales.map((locale) => ({
      url: `${siteOrigin}${localePath(route.path, locale)}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: Object.fromEntries(
          activeLocales.map((l) => [
            getLocale(l).htmlLang,
            `${siteOrigin}${localePath(route.path, l)}`,
          ]),
        ),
      },
    })),
  );
}
