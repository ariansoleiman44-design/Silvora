import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { QuoteCTA } from "@/components/home/QuoteCTA";
import { JsonLd } from "@/components/seo/JsonLd";

import { getProductsFor } from "@/lib/server/product-overrides";
import { setRequestLocale } from "@/lib/locale-server";
import { getCopy } from "@/lib/dictionary";
import { isActiveLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const active = isActiveLocale(locale) ? locale : "en";
  const meta = getCopy(active).pageMeta.products;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/products",
    locale: active,
  });
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Publishes the locale for every server component below this
  // point. Next renders route segments independently, so the
  // layout setting it is not enough — each page must too.
  setRequestLocale(locale);
  const products = await getProductsFor(locale as never);
  const copy = getCopy();
  const t = copy.products;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }], locale as never)} />
      <PageHero
        eyebrow={t.eyebrow}
        lines={t.headline}
        intro={t.intro}
        image="productsHero"
        size="md"
        crumbs={[{ name: copy.product.breadcrumbHome, href: "/" }, { name: copy.product.breadcrumbProducts }]}
        position="50% 60%"
      />
      <section className="bg-cream py-10 text-ink md:py-16">
        <Suspense fallback={<div className="container-x min-h-[50vh]" />}>
          <ProductCatalog products={products} />
        </Suspense>
      </section>
      <QuoteCTA image="balesClouds" />
    </>
  );
}
