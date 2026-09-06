import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { QuoteCTA } from "@/components/home/QuoteCTA";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealGroup, RevealItem, RevealLines } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { companyFacts } from "@/data/about";
import { setRequestLocale } from "@/lib/locale-server";
import { getCopy } from "@/lib/dictionary";
import type { MediaKey } from "@/data/media";
import { isActiveLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { cn, pad2 } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const active = isActiveLocale(locale) ? locale : "en";
  const meta = getCopy(active).pageMeta.about;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/about",
    locale: active,
  });
}

const chapterImages: MediaKey[] = ["cornHorizon", "farmerInCorn", "squareStack", "rollingFarm"];

export default async function AboutPage({
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
  const t = copy.about;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <PageHero eyebrow={t.eyebrow} lines={t.headline} intro={t.intro} image="aboutHero" size="lg" position="50% 55%" />

      {/* Manifesto */}
      <section className="section-y bg-cream text-ink">
        <div className="container-x">
          <RevealGroup as="ol" className="grid gap-px border border-ink/12 bg-ink/12 md:grid-cols-2">
            {t.manifesto.map((m, i) => (
              <RevealItem as="li" key={m.title} className="bg-cream p-7 md:p-12">
                <span className="eyebrow text-gold">{pad2(i + 1)}</span>
                <h2 className="display-md mt-6 uppercase">{m.title}</h2>
                <p className="body-lg mt-5 max-w-md text-ink/65">{m.text}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Chapters */}
      <section className="bg-cream-deep text-ink">
        {t.chapters.map((ch, i) => {
          const flip = i % 2 === 1;
          return (
            <div key={ch.eyebrow} className={cn("border-t border-ink/10", i === 0 && "border-t-0")}>
              <div className="container-x grid items-center gap-10 py-16 lg:grid-cols-12 lg:gap-8 lg:py-24">
                <ImageFrame
                  image={chapterImages[i] ?? "cornHorizon"}
                  className={cn("aspect-[4/3] lg:col-span-6", flip ? "lg:order-2 lg:col-start-7" : "")}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  parallax={5}
                />
                <div className={cn("lg:col-span-5", flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-8")}>
                  <Reveal>
                    <Eyebrow className="mb-6">{ch.eyebrow}</Eyebrow>
                  </Reveal>
                  <RevealLines lines={[ch.title]} className="display-md" />
                  <Reveal delay={0.15}>
                    <p className="body-lg mt-6 max-w-md text-ink/65">{ch.text}</p>
                  </Reveal>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Company facts — renders only when real details exist */}
      {companyFacts.length > 0 && (
        <section className="section-y-sm bg-cream text-ink">
          <div className="container-x">
            <Reveal>
              <Eyebrow className="mb-6">{t.factsTitle}</Eyebrow>
            </Reveal>
            <dl className="grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-2 lg:grid-cols-4">
              {companyFacts.map((f) => (
                <div key={f.label} className="bg-cream p-6">
                  <dt className="eyebrow text-ink/60">{f.label}</dt>
                  <dd className="mt-3 font-display text-3xl">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <QuoteCTA
        image="holsteinGolden"
        headline={["Work", "with us."]}
        sub="Whether you feed fifty head or five thousand, tell us what you need and we will plan it with you."
        primary={{ label: copy.common.requestQuote, href: "/quote" }}
        secondary={{ label: copy.common.talkToSales, href: "/contact" }}
      />
    </>
  );
}
