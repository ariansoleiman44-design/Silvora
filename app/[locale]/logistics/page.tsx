import type { Metadata } from "next";
import { Boxes, Container, MapPin, Route, Ship, Truck } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { QuoteCTA } from "@/components/home/QuoteCTA";
import { CommercialSupply } from "@/components/home/CommercialSupply";
import { DeliveryPlanner } from "@/components/logistics/DeliveryPlanner";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealGroup, RevealItem, RevealLines } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/data/site-config";
import { setRequestLocale } from "@/lib/locale-server";
import { getCopy } from "@/lib/dictionary";
import { isActiveLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { pad2 } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const active = isActiveLocale(locale) ? locale : "en";
  const meta = getCopy(active).pageMeta.logistics;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/logistics",
    locale: active,
  });
}

const icons = [MapPin, Truck, Boxes, Route, Ship, Container];

export default async function LogisticsPage({
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
  const t = copy.logisticsPage;
  const areas = siteConfig.serviceAreas;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Logistics", path: "/logistics" }], locale as never)} />
      <PageHero eyebrow={t.eyebrow} lines={t.headline} intro={t.intro} image="logisticsHero" size="md" position="50% 60%" />

      <section className="section-y bg-cream text-ink">
        <div className="container-x">
          <RevealGroup as="ul" className="grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-2 lg:grid-cols-3">
            {t.sections.map((s, i) => {
              const Icon = icons[i] ?? Truck;
              return (
                <RevealItem as="li" key={s.title} className="bg-cream p-6 md:p-9">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-leaf" strokeWidth={1.25} aria-hidden />
                    <span className="eyebrow text-ink/60">{pad2(i + 1)}</span>
                  </div>
                  <h2 className="display-sm mt-8">{s.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink/65 md:text-[0.9375rem]">{s.text}</p>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Image band */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <ImageFrame image="combineSunset" className="aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]" sizes="100vw" parallax={8} reveal={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" aria-hidden />
        <div className="container-x absolute inset-x-0 bottom-0 pb-10 md:pb-16">
          <Reveal>
            <p className="display-md max-w-2xl uppercase">
              <span className="block">Loaded for stability.</span>
              <span className="block italic normal-case text-wheat">Delivered on schedule.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* Service areas */}
      <section className="section-y-sm bg-cream-deep text-ink">
        <div className="container-x grid gap-8 md:grid-cols-12 md:items-start">
          <div className="md:col-span-4">
            <Reveal>
              <Eyebrow className="mb-4">{copy.logistics.areasTitle}</Eyebrow>
            </Reveal>
            <RevealLines lines={["Where we", "deliver."]} className="display-md uppercase" />
          </div>
          <Reveal delay={0.1} className="md:col-span-7 md:col-start-6">
            {areas.length ? (
              <ul className="grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-2">
                {areas.map((a) => (
                  <li key={a.name} className="bg-cream-deep p-5">
                    <p className="font-display text-xl">{a.name}</p>
                    {a.note && <p className="mt-1 text-sm text-ink/60">{a.note}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lead text-ink/65">{copy.logistics.areasEmpty}</p>
            )}
          </Reveal>
        </div>
      </section>

      <DeliveryPlanner />

      <CommercialSupply />

      <QuoteCTA
        image="balesHills"
        headline={t.planHeadline}
        sub={t.planText}
        primary={{ label: t.planCta, href: "/quote?delivery=yes" }}
        secondary={{ label: copy.common.talkToSales, href: "/contact" }}
      />
    </>
  );
}
