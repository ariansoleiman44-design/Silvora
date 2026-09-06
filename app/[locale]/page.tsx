import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { BrandStatement } from "@/components/home/BrandStatement";
import { Collection } from "@/components/home/Collection";
import { ProcessWhy } from "@/components/home/ProcessWhy";
import { LogisticsSection } from "@/components/home/LogisticsSection";
import { QuoteCTA } from "@/components/home/QuoteCTA";
import { FAQSection } from "@/components/home/FAQSection";
import { Seam } from "@/components/ui/Seam";
import { setRequestLocale } from "@/lib/locale-server";
import { getCopy } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/seo";
import { isActiveLocale } from "@/lib/i18n";

// Interactive sections below the fold are split into their own chunks so
// the hero and first sections hydrate first.
const SignatureBale = dynamic(() => import("@/components/home/SignatureBale").then((m) => m.SignatureBale));
const PerfectBale = dynamic(() => import("@/components/home/PerfectBale").then((m) => m.PerfectBale));
const BaleFinder = dynamic(() => import("@/components/home/BaleFinder").then((m) => m.BaleFinder));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const active = isActiveLocale(locale) ? locale : "en";
  const seo = getCopy(active).seo;
  return buildMetadata({
    title: seo.defaultTitle,
    description: seo.defaultDescription,
    path: "/",
    locale: active,
  });
}

/**
 * HOMEPAGE — eleven movements, paced rather than exhaustive.
 *
 *   Hero · Trust · Belief · Collection · Signature bale · The perfect
 *   bale · Process & principles · Bale finder · Logistics · Quote · FAQ
 *
 * The tools and the deep reference material live on the pages that own
 * them: the silage calculator on /quote, the format comparison and the
 * inspection checklist on /quality. Footer links point there directly.
 */
export default async function HomePage({
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
  const ch = copy.chapters;
  return (
    <>
      <Hero />
      <TrustStrip />

      <Seam index={1} label={ch.belief} bg="bg-cream-deep" />
      <BrandStatement />

      <Seam index={2} label={ch.collection} bg="bg-cream" />
      <Collection />

      {/* The dark movement: one long descent from forest to near-black. */}
      <Seam index={3} label={ch.signature} bg="bg-forest-deep" tone="dark" />
      <SignatureBale />
      <PerfectBale />

      <Seam index={4} label={ch.process} bg="bg-cream" />
      <ProcessWhy />

      <Seam index={5} label={ch.finder} bg="bg-forest" tone="dark" />
      <BaleFinder />

      <Seam index={6} label={ch.logistics} bg="bg-cream-deep" />
      <LogisticsSection />

      <QuoteCTA />

      <Seam index={7} label={ch.questions} bg="bg-cream" />
      <FAQSection />
    </>
  );
}
