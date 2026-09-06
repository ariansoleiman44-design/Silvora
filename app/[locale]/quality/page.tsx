import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { QualitySection } from "@/components/home/QualitySection";
import { Comparison } from "@/components/home/Comparison";
import { QuoteCTA } from "@/components/home/QuoteCTA";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealGroup, RevealItem, RevealLines } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { media, type MediaKey } from "@/data/media";
import { labBatches, labParameters, labPlaceholderText } from "@/data/lab-data";
import { withoutDemo } from "@/lib/demo-policy";
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
  const meta = getCopy(active).pageMeta.quality;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/quality",
    locale: active,
  });
}

const chapterImages: MediaKey[] = [
  "cornFieldSky",
  "harvesterLoading",
  "harvesterHead",
  "compaction",
  "balesStack",
  "balesBlack",
  "logisticsHero",
  "squareStack",
  "tractorTrailer",
];

export default async function QualityPage({
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
  const t = copy.qualityPage;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Quality", path: "/quality" }])} />
      <PageHero eyebrow={t.eyebrow} lines={t.headline} intro={t.intro} image="qualityHero" size="lg" position="60% 50%" />

      {/* Nine chapters */}
      <section className="section-y bg-cream text-ink">
        <div className="container-x">
          <RevealGroup as="ol" className="grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-2 lg:grid-cols-3">
            {t.chapters.map((ch, i) => {
              const img = media[chapterImages[i] ?? "balesField"];
              return (
                <RevealItem as="li" key={ch.title} className="bg-cream">
                  <div className="grid grid-cols-5 gap-5 p-5 sm:block sm:p-0">
                    <div className="graded relative col-span-2 aspect-[4/5] overflow-hidden bg-stone sm:aspect-[4/3]">
                      <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 40vw" className="object-cover" />
                      <div className="absolute inset-x-0 top-0 z-[3] h-1/2 bg-gradient-to-b from-ink/60 to-transparent" aria-hidden />
                      <span className="absolute start-4 top-4 z-[3] font-display text-3xl text-cream sm:text-4xl">
                        {pad2(i + 1)}
                      </span>
                    </div>
                    <div className="col-span-3 flex flex-col justify-center sm:p-7 md:p-8">
                      <h2 className="display-sm">{ch.title}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-ink/65 md:text-[0.9375rem]">{ch.text}</p>
                    </div>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      <QualitySection />

      {/* Format comparison. Linked from the footer as /quality#compare. */}
      <Comparison />

      {/* Laboratory analysis */}
      <section id="lab" className="section-y bg-cream-deep text-ink">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <Eyebrow className="mb-6">{t.labEyebrow}</Eyebrow>
              </Reveal>
              <RevealLines lines={t.labHeadline} className="display-lg uppercase" />
              <Reveal delay={0.15}>
                <p className="body-lg mt-6 max-w-sm text-ink/65">{t.labIntro}</p>
              </Reveal>
              <Reveal delay={0.2} className="mt-8">
                <Button href="/quote" variant="ink">
                  {t.labCta}
                </Button>
              </Reveal>
            </div>
          </div>

          <Reveal y={20} className="lg:col-span-8">
            {/* Demo batch records are hidden in production — a buyer must
                never mistake an illustrative analysis for a real one. */}
            {withoutDemo(labBatches).map((batch) => (
              <div key={batch.batchId} className="border border-ink/12 bg-cream">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/12 px-5 py-4 md:px-7">
                  <div>
                    <p className="eyebrow text-ink/60">{t.labBatch}</p>
                    <p className="mono-num mt-1 font-display text-xl">
                      {batch.batchId}
                      {batch.demo && (
                        <span className="ms-2 align-middle text-[0.5625rem] font-sans font-semibold uppercase tracking-[0.18em] text-gold">
                          {copy.common.demoLabel}
                        </span>
                      )}
                    </p>
                  </div>
                  <dl className="grid grid-cols-3 gap-6 text-xs text-ink/60">
                    <div>
                      <dt className="eyebrow text-ink/60">Product</dt>
                      <dd className="mt-1">{batch.product}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-ink/60">Harvest</dt>
                      <dd className="mt-1">{batch.harvestWindow}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-ink/60">Laboratory</dt>
                      <dd className="mt-1">{batch.laboratory}</dd>
                    </div>
                  </dl>
                </div>
                <table className="w-full">
                  <caption className="sr-only">{t.labEyebrow}</caption>
                  <thead>
                    <tr className="border-b border-ink/12 text-start">
                      <th scope="col" className="eyebrow px-5 py-3 text-start text-ink/60 md:px-7">
                        {t.labParameter}
                      </th>
                      <th scope="col" className="eyebrow px-5 py-3 text-end text-ink/60 md:px-7">
                        {t.labValue}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {labParameters.map((p) => {
                      const v = batch.values[p.key];
                      return (
                        <tr key={p.key}>
                          <th scope="row" className="px-5 py-4 text-start font-normal md:px-7">
                            <span className="block text-[0.9375rem]">{p.label}</span>
                            <span className="mt-0.5 block text-xs text-ink/60">{p.description}</span>
                          </th>
                          <td className="mono-num px-5 py-4 text-end md:px-7">
                            {typeof v === "number" ? (
                              <span className="font-display text-2xl">
                                {v}
                                <span className="ms-1 text-sm text-ink/60">{p.unit}</span>
                              </span>
                            ) : (
                              <span className="text-sm italic text-ink/60">{labPlaceholderText}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <QuoteCTA image="baleGolden" />
    </>
  );
}
