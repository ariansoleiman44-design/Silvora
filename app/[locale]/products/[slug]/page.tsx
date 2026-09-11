import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductBuyBox } from "@/components/products/ProductBuyBox";
import { ProductDetails } from "@/components/products/ProductDetails";
import { MobileBuyBar } from "@/components/products/MobileBuyBar";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { BatchInformation } from "@/components/products/BatchInformation";
import { QuoteCTA } from "@/components/home/QuoteCTA";
import { getRelatedProducts, products } from "@/data/products";
import { getCopy } from "@/lib/dictionary";
import { setRequestLocale } from "@/lib/locale-server";
import { getDictionaryFor } from "@/data/dictionaries";
import { getProductFor, getProductsFor } from "@/lib/server/product-overrides";
import { isActiveLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata, productJsonLd } from "@/lib/seo";
import { visibleBatches } from "@/lib/spec-sheet";
import { sanitizeProduct } from "@/lib/demo-policy";

interface Params {
  params: Promise<{ slug: string; locale: string }>;
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, locale } = await params;
  const active = isActiveLocale(locale) ? locale : "en";
  const dict = getDictionaryFor(active);
  /*
   * The PATCHED product, not dict.products. Reading the committed
   * catalogue here meant a name or search-listing edit made in the
   * admin panel changed the page body but not its <title>, description,
   * canonical or Open Graph tags — the panel said "Saved and published"
   * while the thing search engines and link previews actually read was
   * still the old copy.
   */
  const product = await getProductFor(active as never, slug);
  if (!product) return {};
  const formatLabels = dict.labels.format;
  const applicationLabels = dict.labels.application;
  const template = dict.copy.pageMeta.product;

  // Token substitution rather than string concatenation: Arabic orders
  // these parts differently from English, and a hardcoded template
  // produces the half-translated titles this replaced.
  const fill = (s: string) =>
    s
      .replaceAll("{name}", product.name)
      .replaceAll("{short}", product.shortDescription)
      .replaceAll("{format}", formatLabels[product.format])
      .replaceAll(
        "{applications}",
        product.application.map((a) => applicationLabels[a]).join(dict.copy.common.listSeparator),
      );

  return buildMetadata({
    title: product.seo?.title ?? fill(template.title),
    description: product.seo?.description ?? fill(template.description),
    path: `/products/${product.slug}`,
    locale: active,
    // null → the generated opengraph-image for this product is used.
    image: null,
  });
}

export default async function ProductPage({ params }: Params) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  // The catalogue with any admin edits layered on. Falls back to the
  // committed data when no database is configured, so this page renders
  // identically with or without the panel.
  const catalogue = await getProductsFor(locale as never);
  const raw = catalogue.find((p) => p.slug === slug);
  if (!raw) notFound();

  // Unverified figures are removed before the product crosses into any
  // client component, so they are absent from the HTML payload as well
  // as from the page. See lib/demo-policy.ts for what this does not fix.
  const product = sanitizeProduct(raw);
  const copy = getCopy();

  // Related products come from the same translated catalogue.
  const related = getRelatedProducts(product, 3).map(
    (r) => catalogue.find((p) => p.slug === r.slug) ?? r,
  );
  const crumbs = [
    { name: copy.product.breadcrumbHome, href: "/" },
    { name: copy.product.breadcrumbProducts, href: "/products" },
    { name: product.name },
  ];

  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: product.name, path: `/products/${product.slug}` },
          ]),
        ]}
      />

      {/* Showroom: dark, image-dominant */}
      <section className="grain relative bg-ink text-cream">
        <div className="container-x pt-24 md:pt-32">
          <Breadcrumbs items={crumbs} tone="dark" className="mb-6" />
        </div>
        <div className="grid gap-10 pb-16 lg:container-x lg:grid-cols-12 lg:gap-12 lg:pb-24">
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} name={product.name} />
          </div>
          <div className="px-[var(--gutter)] lg:col-span-5 lg:px-0">
            <div className="lg:sticky lg:top-28">
              <ProductBuyBox product={product} />
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="bg-cream py-14 text-ink md:py-24">
        <ProductDetails product={product} />
      </section>

      {/* Batch records only appear when a product actually has them. */}
      {visibleBatches(product).length > 0 && (
        <section className="bg-cream-deep py-14 text-ink md:py-20">
          <div className="container-x max-w-3xl">
            <BatchInformation product={product} />
            <p className="mt-4 text-xs leading-relaxed text-ink/60">{copy.product.batchIntro}</p>
          </div>
        </section>
      )}

      <RelatedProducts products={related} />

      <QuoteCTA image="balesRow" />

      <MobileBuyBar product={product} />
      {/* Spacer so the sticky bar never covers the footer content */}
      <div className="h-20 bg-ink lg:hidden" aria-hidden />
    </>
  );
}
