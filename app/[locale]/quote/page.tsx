import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { QuoteWizard } from "@/components/quote/QuoteWizard";
import { Calculator } from "@/components/home/Calculator";
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
  const meta = getCopy(active).pageMeta.quote;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/quote",
    locale: active,
  });
}

export default async function QuotePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Publishes the locale for every server component below this
  // point. Next renders route segments independently, so the
  // layout setting it is not enough — each page must too.
  setRequestLocale(locale);
  const copy = getCopy();
  const t = copy.rfq;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Request a Quote", path: "/quote" }], locale as never)} />
      <PageHero eyebrow={t.eyebrow} lines={t.headline} intro={t.intro} image="quoteHero" size="sm" position="50% 45%" />
      <section className="bg-cream py-14 text-ink md:py-24">
        <div className="container-x">
          <Suspense fallback={<div className="min-h-[50vh]" />}>
            <QuoteWizard />
          </Suspense>
        </div>
      </section>
      {/* The planning tool lives with the quote it feeds. Linked from the
          footer as /quote#calculator. */}
      <Calculator />
    </>
  );
}
