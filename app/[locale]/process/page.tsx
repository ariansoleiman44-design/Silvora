import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { FieldToFeed } from "@/components/home/FieldToFeed";
import { PerfectBale } from "@/components/home/PerfectBale";
import { QuoteCTA } from "@/components/home/QuoteCTA";
import { JsonLd } from "@/components/seo/JsonLd";
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
  const meta = getCopy(active).pageMeta.process;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/process",
    locale: active,
  });
}

export default async function ProcessPage({
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
  const t = copy.processPage;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Our Process", path: "/process" }])} />
      <PageHero eyebrow={t.eyebrow} lines={t.headline} intro={t.intro} image="processHero" size="md" italicLast />
      <FieldToFeed />
      <PerfectBale />
      <QuoteCTA image="harvestGolden" />
    </>
  );
}
